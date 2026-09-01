import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { verifyPassword, generateEmailBlindIndex } from '@/lib/crypto/kdf';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { appendEntry } from '@/lib/audit/log';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
        is2FAPhase: { label: "2FA Phase", type: "hidden" }
      },
      async authorize(credentials) {
        await dbConnect();
        
        if (!credentials?.email) throw new Error("Missing email");

        const emailHash = generateEmailBlindIndex(credentials.email);
        const user = await User.findOne({ emailHash });
        
        if (!user) throw new Error("Invalid credentials");

        if (credentials.is2FAPhase === 'true') {
          // Verify OTP phase
          if (!credentials.otp) throw new Error("Missing OTP");
          if (!user.otpHash || !user.otpExpiresAt) throw new Error("No active OTP session. Please login again.");
          if (new Date() > user.otpExpiresAt) throw new Error("OTP has expired");
          
          const inputHash = crypto.createHash('sha256').update(credentials.otp).digest('hex');
          const expectedBuf = Buffer.from(user.otpHash, 'hex');
          const inputBuf = Buffer.from(inputHash, 'hex');
          
          if (expectedBuf.length !== inputBuf.length || !crypto.timingSafeEqual(expectedBuf, inputBuf)) {
            throw new Error("Invalid 2FA code");
          }
          
          // OTP verified
          user.otpHash = undefined;
          user.otpExpiresAt = undefined;
          await user.save();
          
          await appendEntry(user.id, 'USER_LOGIN', `User ${user.role} logged in successfully with 2FA via NextAuth`);
          
          return { id: user.id, email: credentials.email, role: user.role };
        } else {
          // Phase 1: Verify Password and Send OTP
          if (!credentials.password) throw new Error("Missing password");
          const isValid = verifyPassword(credentials.password, user.passwordHash, user.salt, 10000);
          if (!isValid) throw new Error("Invalid credentials");
          
          // Generate OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
          
          if (process.env.NODE_ENV !== 'production') {
            console.log(`\n[DEV ONLY] 2FA Code for ${credentials.email}: ${otp}\n`);
          }
          
          user.otpHash = otpHash;
          user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
          await user.save();
          
          // Send Email
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
            to: credentials.email,
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
          
          throw new Error("2FA_REQUIRED");
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.SERVER_SECRET || 'dev-secret-change-in-production',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
