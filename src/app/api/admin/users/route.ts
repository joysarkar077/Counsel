import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { requireRole } from '@/lib/auth/rbac';
import { decryptOrFallback, type ECIESCiphertext } from '@/lib/crypto/ecc';

/**
 * GET /api/admin/users
 *
 * Returns all clients and lawyers with their decrypted PII (email, contact).
 * Decryption is done server-side using each user's own ECC private key
 * (stored as a plain hex scalar in encryptedPrivateKey).
 */
const getHandler = async function GET(req: Request) {
  try {
    await dbConnect();

    // encryptedPrivateKey is the raw ECC scalar hex for each user.
    // Profile fields are ECIES-encrypted JSON bundles — use ecc.decryptOrFallback.
    const tryDecryptField = (encJson: string | undefined, eccPrivKey: string | undefined, fallback: string): string => {
      if (!encJson || !eccPrivKey) return fallback;
      try {
        const bundle: ECIESCiphertext = JSON.parse(encJson);
        return decryptOrFallback(bundle, eccPrivKey, fallback);
      } catch {
        return fallback;
      }
    };

    // Fetch all clients and lawyers
    const users = await User.find({ role: { $in: ['client', 'lawyer'] } })
      .sort({ createdAt: -1 })
      .lean();

    const userData = users.map(user => {
      const eccPrivKey = user.encryptedPrivateKey;

      return {
        id: user._id.toString(),
        name: user.fullName || `User ${user._id.toString().slice(-4)}`,
        role: user.role,
        publicKey: user.publicKey,
        email: tryDecryptField(user.email_enc, eccPrivKey, ''),
        contact: tryDecryptField(user.contact_enc, eccPrivKey, ''),
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
