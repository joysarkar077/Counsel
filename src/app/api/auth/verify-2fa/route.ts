import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { hmacSha256 } from '@/lib/crypto/hmac';
import crypto from 'crypto';
import { appendEntry } from '@/lib/audit/log';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json({ error: 'Missing OTP' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const tempToken = cookieStore.get('temp_auth_token')?.value;

    if (!tempToken) {
      return NextResponse.json({ error: 'Session expired, please login again' }, { status: 401 });
    }

    // Verify temp token integrity (HMAC)
    const [userId, role, signature] = tempToken.split('.');
    const serverSecret = process.env.SERVER_SECRET || 'dev-secret-change-in-production';
    const expectedSignature = hmacSha256(
      Buffer.from(serverSecret, 'utf-8'),
      Buffer.from(`${userId}.${role}`, 'utf-8')
    ).toString('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid temporary session' }, { status: 401 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json({ error: 'No active OTP session. Please login again.' }, { status: 401 });
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 401 });
    }

    const inputHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    // Constant time compare to prevent timing side channels
    const expectedBuf = Buffer.from(user.otpHash, 'hex');
    const inputBuf = Buffer.from(inputHash, 'hex');
    
    if (expectedBuf.length !== inputBuf.length || !crypto.timingSafeEqual(expectedBuf, inputBuf)) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
    }

    // Clear OTP fields so it can't be reused
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Create full session payload
    // Sabid will replace this with an ECDSA signature later. For now, we use HMAC.
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 24 * 60 * 60; // 24 hours
    const payload = { userId, role: user.role, iat, exp };
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const sessionSignature = hmacSha256(
      Buffer.from(serverSecret, 'utf-8'),
      Buffer.from(payloadStr, 'utf-8')
    ).toString('hex');

    const sessionToken = `header.${payloadStr}.${sessionSignature}`;

    // Clear temp token and set session token
    cookieStore.delete('temp_auth_token');
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    await appendEntry(user.id, 'USER_LOGIN', `User ${user.role} logged in successfully with 2FA`);

    return NextResponse.json({
      message: 'Verification successful',
      role: user.role
    }, { status: 200 });

  } catch (error: any) {
    console.error('2FA error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
