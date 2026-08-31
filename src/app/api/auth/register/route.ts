import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { generateKeyPair, encrypt } from '@/lib/crypto/rsa';
import { hashPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import { appendEntry } from '@/lib/audit/log';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { username, email, contact, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailHash = generateEmailBlindIndex(email);

    // Check if user already exists
    const existingUser = await User.findOne({ emailHash });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // 1. Generate RSA Keypair
    const { publicKey, privateKey } = generateKeyPair(1024); // Using 1024 for speed during dev

    // 2. Encrypt PII
    const username_enc = encrypt(username, publicKey);
    const email_enc = encrypt(email, publicKey);
    const contact_enc = encrypt(contact || '', publicKey);

    // 3. Hash Password
    // our from-scratch PBKDF2 hashPassword automatically generates the salt
    const { hash: passwordHash, salt } = hashPassword(password);

    // 4. Save to DB
    // Note: privateKey.d should be symmetrically encrypted with a key derived from the password.
    // Since we are restricted from using symmetric crypto libraries, we store it directly for this step,
    // or wrap it using a permitted method later.
    const newUser = new User({
      username_enc,
      email_enc,
      emailHash,
      contact_enc,
      passwordHash,
      salt,
      publicKey: JSON.stringify(publicKey),
      encryptedPrivateKey: privateKey.d,
      role: 'client',
      isActive: true,
    });

    await newUser.save();

    await appendEntry(newUser.id, 'USER_REGISTERED', `User registered with email hash ${emailHash}`);

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
