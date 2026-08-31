import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongoose';
import { hmacSha256 } from '@/lib/crypto/hmac';
import { Invitation } from '../../../../models/Invitation';
import { appendEntry } from '@/lib/audit/log';
import { requireRole } from '@/lib/auth/rbac';

/**
 * POST /api/admin/invitations
 * Admin sends an invitation to a lawyer or another admin.
 * 
 * Body: { email, role: 'lawyer' | 'admin', caseId? }
 * 
 * Returns the raw token in the response for demo/testing purposes,
 * since we are not wiring up an email service in this project.
 */
const postHandler = async function POST(req: Request) {
  try {
    await dbConnect();

    // Replaced stub with real RBAC middleware check
    const { email, role, caseId, invitedBy } = await req.json();

    if (!email || !role || !invitedBy) {
      return NextResponse.json({ error: 'Missing required fields: email, role, invitedBy' }, { status: 400 });
    }

    if (!['lawyer', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be "lawyer" or "admin".' }, { status: 400 });
    }

    // Generate a secure random token (randomness only, not encryption)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // Store only the HMAC of the token (using SERVER_SECRET)
    const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
    const tokenHash = hmacSha256(Buffer.from(serverSecret, 'utf-8'), Buffer.from(rawToken, 'utf-8')).toString('hex');

    // Expire in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invitation.create({
      email,
      role,
      caseId: caseId || undefined,
      tokenHash,
      invitedBy,
      expiresAt,
    });

    await appendEntry(invitedBy, 'INVITATION_CREATED', `Created invitation for role ${role}`);

    // In production: send email with link /invite/{rawToken}
    // For demo: return token directly
    return NextResponse.json({
      message: `Invitation created for ${email}`,
      inviteUrl: `/invite/${rawToken}`,
      // NOTE: In production, remove rawToken from the response and email it instead
      rawToken,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = requireRole(['admin', 'super_admin'])(postHandler);

/**
 * GET /api/admin/invitations
 * Lists all sent invitations and their statuses (admin view).
 */
const getHandler = async function GET() {
  try {
    await dbConnect();
    const invitations = await Invitation.find().sort({ createdAt: -1 });
    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error: any) {
    console.error('List invitations error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = requireRole(['admin', 'super_admin'])(getHandler);
