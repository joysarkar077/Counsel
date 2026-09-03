import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { encrypt } from '@/lib/crypto/rsa';

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, contact, address, bloodGroup, avatarUrl, avatarKey } = await req.json();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const publicKey = JSON.parse(user.publicKey);

    // Encrypt fields
    if (name) user.username_enc = encrypt(name, publicKey);
    if (contact) user.contact_enc = encrypt(contact, publicKey);
    if (address) user.address_enc = encrypt(address, publicKey);
    if (bloodGroup) user.bloodGroup_enc = encrypt(bloodGroup, publicKey);
    if (avatarUrl) user.avatarUrl = avatarUrl;
    if (avatarKey) user.avatarKey_enc = encrypt(avatarKey, publicKey);

    await user.save();

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
