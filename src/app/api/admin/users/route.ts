import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';
import { decrypt } from '@/lib/crypto/rsa';

/**
 * GET /api/admin/users
 *
 * Returns all clients and lawyers with their decrypted PII (email, contact).
 * Decryption is done server-side using the requesting admin's RSA private key.
 * This prevents any private key from leaking to the browser.
 */
const getHandler = async function GET(req: Request) {
  try {
    await dbConnect();

    const tryDecryptField = (encHex: string | undefined, userPrivateKey: {d: string, n: string} | null, fallback: string): string => {
      if (!encHex || !userPrivateKey) return fallback;
      try {
        return decrypt(encHex, userPrivateKey);
      } catch {
        return fallback;
      }
    };

    // Fetch all clients and lawyers
    const users = await User.find({ role: { $in: ['client', 'lawyer'] } })
      .sort({ createdAt: -1 })
      .lean();

    const userData = users.map(user => {
      let userPrivateKey: { d: string; n: string } | null = null;
      if (user.publicKey && user.encryptedPrivateKey) {
        try {
          const pub = JSON.parse(user.publicKey);
          userPrivateKey = { d: user.encryptedPrivateKey, n: pub.n };
        } catch {
          // ignore
        }
      }

      return {
        id: user._id.toString(),
        name: user.fullName || `User ${user._id.toString().slice(-4)}`,
        role: user.role,
        publicKey: user.publicKey,
        email: tryDecryptField(user.email_enc, userPrivateKey, ''),
        contact: tryDecryptField(user.contact_enc, userPrivateKey, ''),
        avatarUrl: user.avatarUrl ?? null,
        isActive: user.isActive,
        position: user.position ?? null,
        department: user.department ?? null,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
      };
    });

    return NextResponse.json({ success: true, data: userData }, { status: 200 });
  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
};

export const GET = requireRole(['admin', 'super_admin'])(getHandler);
