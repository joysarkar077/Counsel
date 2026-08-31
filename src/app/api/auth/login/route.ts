import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { verifyPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import { hmacSha256 } from '@/lib/crypto/hmac';

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
    const isValid = verifyPassword(password, user.passwordHash, user.salt, 10000);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // 3. Login successful (First Factor)
    // Generate a temporary auth token to identify the user in the 2FA step
    const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
    const signature = hmacSha256(
      Buffer.from(serverSecret, 'utf-8'),
      Buffer.from(`${user.id}.${user.role}`, 'utf-8')
    ).toString('hex');
    
    const tempToken = `${user.id}.${user.role}.${signature}`;
    
    const cookieStore = await cookies();
    cookieStore.set('temp_auth_token', tempToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 10 * 60, // 10 minutes to complete 2FA
    });

    return NextResponse.json({
      message: 'Password verified, 2FA required',
      requires2FA: true
    }, { status: 200 });

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
