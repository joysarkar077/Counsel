import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { verifyPassword, generateEmailBlindIndex } from '@/lib/crypto/kdfStub';

export async function POST(req: Request) {
  try {
    await dbConnect();

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailHash = generateEmailBlindIndex(email);

    // 1. Find user by blind index
    const user = await User.findOne({ emailHash });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 2. Verify Password
    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Login successful
    // At this point, in a full system, we would generate a session token (ECDSA signed)
    const response = NextResponse.json({
      message: 'Login successful',
      role: user.role,
      // Returning public key so client can potentially encrypt messages
      publicKey: user.publicKey
    }, { status: 200 });

    response.cookies.set('userId', user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
