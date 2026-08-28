import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongoose';
import { Invitation } from '@/lib/models/Invitation';

/**
 * POST /api/admin/invitations
 * Admin sends an invitation to a lawyer or another admin.
 * 
 * Body: { email, role: 'lawyer' | 'admin', caseId? }
 * 
 * Returns the raw token in the response for demo/testing purposes,
 * since we are not wiring up an email service in this project.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    // TODO (Farjana - RBAC): Replace with real middleware check that verifies
    // the requester is an admin or super_admin.
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
    // Using Node's built-in crypto for HMAC as a stub until Farjana's hmac.ts is ready
    const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
    const tokenHash = crypto.createHmac('sha256', serverSecret).update(rawToken).digest('hex');

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

/**
 * GET /api/admin/invitations
 * Lists all sent invitations and their statuses (admin view).
 */
export async function GET() {
  try {
    await dbConnect();
    const invitations = await Invitation.find().sort({ createdAt: -1 });
    return NextResponse.json({ invitations }, { status: 200 });
  } catch (error: any) {
    console.error('List invitations error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
