import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { generateKeyPair as generateECCKeyPair, encrypt as encryptECIES } from '@/lib/crypto/ecc';
import { generateKeyPair as generateRSAKeyPair, encrypt as encryptRSA } from '@/lib/crypto/rsa';
import { hashPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import { appendEntry } from '@/lib/audit/log';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { username, email, contact, password, role = 'client' } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (role !== 'client' && role !== 'lawyer') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const emailHash = generateEmailBlindIndex(email);

    // Check if user already exists
    const existingUser = await User.findOne({ emailHash });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // 1. Generate ECC keypair (secp256k1) — used for ECIES data encryption/decryption
    const eccKeyPair = generateECCKeyPair();

    // 2. Encrypt PII with ECIES using the user's own ECC public key.
    //    Only the holder of eccKeyPair.privateKey can decrypt these fields.
    const username_enc = JSON.stringify(encryptECIES(username, eccKeyPair.publicKey));
    const email_enc = JSON.stringify(encryptECIES(email, eccKeyPair.publicKey));
    const contact_enc = JSON.stringify(encryptECIES(contact || 'None', eccKeyPair.publicKey));

    // 3. Generate RSA-1024 keypair — used exclusively for digital signatures (second asymmetric algorithm).
    //    Larger key sizes (2048) would be production-grade; 1024 is used here for keygen speed.
    const rsaKeyPair = generateRSAKeyPair(1024);

    // 4. Hash Password using our from-scratch PBKDF2 (auto-generates salt)
    const { hash: passwordHash, salt } = hashPassword(password);

    // 5. Persist
    const newUser = new User({
      fullName: username, // plaintext for admin display routing
      username_enc,
      email_enc,
      emailHash,
      contact_enc,
      passwordHash,
      salt,
      // ECC keypair — for ECIES encryption (primary asymmetric algorithm)
      publicKey: eccKeyPair.publicKey,
      encryptedPrivateKey: eccKeyPair.privateKey,
      // RSA keypair — for digital signatures (second asymmetric algorithm)
      rsaPublicKey: JSON.stringify(rsaKeyPair.publicKey),
      rsaPrivateKey: rsaKeyPair.privateKey.d,
      role,
      isActive: role === 'client', // Lawyers require admin activation
    });

    await newUser.save();

    await appendEntry(newUser.id, 'USER_REGISTERED', `User registered with email hash ${emailHash}`);

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      data: { id: newUser.id }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
