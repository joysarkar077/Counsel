import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { generateKeyPair } from '@/lib/crypto/rsa';
import { appendEntry } from '@/lib/audit/log';

export async function POST(req: Request) {
  try {
    await dbConnect();
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    try {
      const payloadStr = Buffer.from(sessionToken.split('.')[1] || '', 'base64url').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      userId = payload.userId;
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new RSA keys (Identity / Wrapping)
    const { publicKey, privateKey } = generateKeyPair(1024);

    // Sabid's ECC key generation will go here later:
    // const eccKeys = generateEccKeyPair();
    
    // In a real scenario, rotating a key means re-encrypting PII and stored keys.
    // For this prototype, we're just storing the new generated keys.
    user.publicKey = JSON.stringify(publicKey);
    user.encryptedPrivateKey = privateKey.d;
    
    await user.save();

    await appendEntry(user.id, 'KEY_ROTATION', 'User rotated cryptographic keys');

    return NextResponse.json({ message: 'Keys rotated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Key management error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
