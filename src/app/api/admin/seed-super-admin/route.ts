import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { generateKeyPair, encrypt } from '@/lib/crypto/rsa';
import { hashPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import { appendEntry } from '@/lib/audit/log';

/**
 * Seed script to create the Super Admin account.
 * This should be called only once on initial setup.
 * POST /api/admin/seed-super-admin
 * 
 * Body: { username, email, password, seedSecret }
 * seedSecret must match SEED_SECRET in .env.local to prevent abuse.
 */
export async function POST(req: Request) {
  try {
    await dbConnect();

    const { username, email, password, seedSecret } = await req.json();

    const expectedSecret = process.env.SEED_SECRET;
    if (!expectedSecret || seedSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const emailHash = generateEmailBlindIndex(email);
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin already exists. This endpoint is disabled.' }, { status: 409 });
    }

    const { publicKey, privateKey } = generateKeyPair(1024);
    const username_enc = encrypt(username, publicKey);
    const email_enc = encrypt(email, publicKey);
    const contact_enc = encrypt('', publicKey);
    const { hash: passwordHash, salt } = hashPassword(password);

    await User.create({
      username_enc,
      email_enc,
      emailHash,
      contact_enc,
      passwordHash,
      salt,
      publicKey: JSON.stringify(publicKey),
      encryptedPrivateKey: privateKey.d,
      role: 'super_admin',
      isActive: true,
    });

    // We don't have a known user ID yet since it's just created, we'll use 'SYSTEM' or the new user's ID
    const superAdmin = await User.findOne({ emailHash });
    if (superAdmin) {
      await appendEntry(superAdmin.id, 'SYSTEM_SEEDED', 'Super Admin account seeded');
    }

    return NextResponse.json({ message: 'Super Admin seeded successfully.' }, { status: 201 });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
