import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { hashPassword, verifyPassword } from '@/lib/crypto/kdf';
import { appendEntry } from '@/lib/audit/log';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing current or new password' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    // The previous implementation used 10000 iterations for PBKDF2 as default.
    const isValid = verifyPassword(currentPassword, user.passwordHash, user.salt, 10000);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect current password' }, { status: 403 });
    }

    // Generate new hash and salt
    const { hash: newPasswordHash, salt: newSalt } = hashPassword(newPassword);

    user.passwordHash = newPasswordHash;
    user.salt = newSalt;
    await user.save();

    await appendEntry(userId, 'PASSWORD_CHANGED', `User changed their password securely.`);

    return NextResponse.json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
