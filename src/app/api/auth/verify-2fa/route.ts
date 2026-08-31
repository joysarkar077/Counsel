import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { verifyTotp } from '@/lib/crypto/totp';
import { hmacSha256 } from '@/lib/crypto/hmac';
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

    // Retrieve TOTP secret from user document
    // If user doesn't have a TOTP secret yet (e.g. first login), we should ideally force setup.
    // For this prototype, we'll assume a shared demo secret if not set.
    const totpSecret = user.totpSecret || process.env.TOTP_SECRET || 'JBSWY3DPEHPK3PXP'; 

    const isValid = verifyTotp(Buffer.from(totpSecret, 'utf-8'), otp, 30, 1);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
    }

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
