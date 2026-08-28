import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/lib/models/User';
import { generateKeyPair, encrypt } from '@/lib/crypto/rsa';
import { hashPassword, generateSalt, generateEmailBlindIndex } from '@/lib/crypto/kdfStub';

/**
 * POST /api/auth/logout
 * Currently invalidates any future session by clearing client state.
 * When Sabid's ECDSA session tokens are in, this will invalidate the session on the DB too.
 */
export async function POST() {
  // TODO (Sabid - Session): Delete the ECDSA-signed session token from the sessions collection.
  // For now, the client simply stops sending the token — logout is handled client-side.
  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}
