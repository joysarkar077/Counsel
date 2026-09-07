import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { generateKeyPair as generateRSAKeyPair } from '@/lib/crypto/rsa';
import { generateKeyPair as generateECCKeyPair } from '@/lib/crypto/ecc';
import { sealPrivateKeys } from '@/lib/crypto/privateKeyVault';
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

    // We require the password to seal the new keys
    const { password } = await req.json().catch(() => ({ password: null }));
    if (!password) {
      return NextResponse.json({ error: 'Password is required to rotate keys' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new ECC keys (Identity / Data Encryption)
    const eccKeys = generateECCKeyPair();

    // Generate new RSA keys (Digital Signatures)
    const rsaKeys = generateRSAKeyPair(1024);

    const { sealedECC, sealedRSA } = sealPrivateKeys(
      eccKeys.privateKey,
      rsaKeys.privateKey.d,
      password,
      user.salt
    );

    // In a real scenario, rotating a key means re-encrypting PII and stored keys.
    // For this prototype, we're just storing the new generated keys.
    user.publicKey = eccKeys.publicKey;
    user.encryptedPrivateKey = sealedECC;
    user.rsaPublicKey = JSON.stringify(rsaKeys.publicKey);
    user.rsaPrivateKey = sealedRSA;
    user.keyVersion = 2;

    await user.save();

    await appendEntry(user.id, 'KEY_ROTATION', 'User rotated cryptographic keys');

    return NextResponse.json({ message: 'Keys rotated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Key management error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
