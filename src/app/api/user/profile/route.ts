import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    await dbConnect();

    // Since session/auth is not fully implemented (waiting for ECDSA session tokens),
    // we'll pass emailHash in the body for now to identify the user.
    // In production, this would be extracted securely from the session cookie.
    const { emailHash, contact_enc } = await req.json();

    if (!emailHash || !contact_enc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await User.findOneAndUpdate(
      { emailHash },
      { contact_enc },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
