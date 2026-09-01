import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '../../../../models/User';
import { verifyPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import { hmacSha256 } from '@/lib/crypto/hmac';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

    // 4. Generate and send Email OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    
    // Log the OTP to the server console during development so users can test with dummy emails
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n[DEV ONLY] 2FA Code for ${email}: ${otp}\n`);
    }

    user.otpHash = otpHash;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Counsel Security" <${process.env.SMTP_USER}>`,
      to: email, // Use the plaintext email from the request
      subject: 'Your 2FA Login Code',
      text: `Your Counsel login code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>Counsel Security</h2>
          <p>Your two-factor authentication code is:</p>
          <h1 style="font-size: 32px; letter-spacing: 4px; color: #1B3A6B; padding: 20px; background: #f1f5f9; text-align: center; border-radius: 8px;">
            ${otp}
          </h1>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 10 minutes. Do not share this code with anyone.</p>
        </div>
      `,
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
