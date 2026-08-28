import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db/mongoose';
import { Invitation } from '@/lib/models/Invitation';
import { User } from '@/lib/models/User';
import { generateKeyPair, encrypt } from '@/lib/crypto/rsa';
import { hashPassword, generateSalt, generateEmailBlindIndex } from '@/lib/crypto/kdfStub';

/**
 * POST /api/auth/invitations/[token]/accept
 * Invited user sets their password to activate their account.
 * Body: { password }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();

    const { token } = await params;
    const { password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    // Recompute HMAC of the submitted token and look it up
    const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
    const tokenHash = crypto.createHmac('sha256', serverSecret).update(token).digest('hex');

    const invitation = await Invitation.findOne({ tokenHash });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation is already ${invitation.status}` }, { status: 410 });
    }

    if (new Date() > invitation.expiresAt) {
      await Invitation.updateOne({ _id: invitation._id }, { status: 'expired' });
      return NextResponse.json({ error: 'Invitation link has expired' }, { status: 410 });
    }

    // Check if user already exists with this email
    const emailHash = generateEmailBlindIndex(invitation.email);
    const existingUser = await User.findOne({ emailHash });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    // Run the RSA registration pipeline (same as /api/auth/register)
    const { publicKey, privateKey } = generateKeyPair(1024); // 1024 for dev speed

    const username_enc = encrypt(invitation.email.split('@')[0], publicKey); // Use email prefix as placeholder username
    const email_enc = encrypt(invitation.email, publicKey);
    const contact_enc = encrypt('', publicKey); // Can be filled later in profile settings

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    await User.create({
      username_enc,
      email_enc,
      emailHash,
      contact_enc,
      passwordHash,
      salt,
      publicKey: JSON.stringify(publicKey),
      encryptedPrivateKey: privateKey.d,
      role: invitation.role,
      isActive: true,
    });

    // Mark the invitation as accepted
    await Invitation.updateOne({ _id: invitation._id }, { status: 'accepted' });

    return NextResponse.json({ message: 'Account created successfully. You can now sign in.' }, { status: 201 });

  } catch (error: any) {
    console.error('Invite accept error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/auth/invitations/[token]
 * Returns metadata about the invitation (email, role) without exposing sensitive data.
 * Used by the invite accept UI to pre-populate the email field.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await dbConnect();

    const { token } = await params;
    const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
    const tokenHash = crypto.createHmac('sha256', serverSecret).update(token).digest('hex');

    const invitation = await Invitation.findOne({ tokenHash });

    if (!invitation || invitation.status !== 'pending' || new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 404 });
    }

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Invite GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
