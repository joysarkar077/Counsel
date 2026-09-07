import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { Invitation } from '../../../../../models/Invitation';
import { User } from '../../../../../models/User';
import { generateKeyPair as generateECCKeyPair, encrypt as encryptECIES } from '@/lib/crypto/ecc';
import { generateKeyPair as generateRSAKeyPair } from '@/lib/crypto/rsa';
import { hashPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import { hmacSha256 } from '@/lib/crypto/hmac';
import { sealPrivateKeys } from '@/lib/crypto/privateKeyVault';


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
    const tokenHash = hmacSha256(Buffer.from(serverSecret, 'utf-8'), Buffer.from(token, 'utf-8')).toString('hex');

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

    // Run the ECC registration pipeline (same scheme as /api/auth/register)
    // 1. ECC keypair — used for ECIES data encryption
    const eccKeyPair = generateECCKeyPair();

    const username_enc = JSON.stringify(encryptECIES(invitation.email.split('@')[0], eccKeyPair.publicKey));
    const email_enc = JSON.stringify(encryptECIES(invitation.email, eccKeyPair.publicKey));
    const contact_enc = JSON.stringify(encryptECIES('', eccKeyPair.publicKey));

    // 2. RSA keypair — stored for digital signatures only
    const rsaKeyPair = generateRSAKeyPair(1024);

    const { hash: passwordHash, salt } = hashPassword(password);

    // Seal both private keys before saving — raw scalars never hit the database.
    const { sealedECC, sealedRSA } = sealPrivateKeys(
      eccKeyPair.privateKey,
      rsaKeyPair.privateKey.d,
      password,
      salt,
    );

    await User.create({
      username_enc,
      email_enc,
      emailHash,
      contact_enc,
      passwordHash,
      salt,
      publicKey: eccKeyPair.publicKey,
      encryptedPrivateKey: sealedECC,
      rsaPublicKey: JSON.stringify(rsaKeyPair.publicKey),
      rsaPrivateKey: sealedRSA,
      keyVersion: 2,
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
    const tokenHash = hmacSha256(Buffer.from(serverSecret, 'utf-8'), Buffer.from(token, 'utf-8')).toString('hex');

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
