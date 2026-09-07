import { getDecryptedKeys } from '@/lib/auth/getDecryptedKeys';
import dbConnect from '@/lib/db/mongoose';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { decryptOrFallback, type ECIESCiphertext } from '@/lib/crypto/ecc';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const [user, notifications] = await Promise.all([
      User.findById(userId).lean(),
      Notification.find({ userId }).sort({ createdAt: -1 }).lean()
    ]);

    // encryptedPrivateKey is the raw ECC scalar hex.
    // Notification fields are ECIES-encrypted JSON bundles — use ecc.decryptOrFallback.
    const { eccPrivateKey: eccPrivKey } = await getDecryptedKeys();

    const tryDecrypt = (encJson: string | undefined, fallback: string): string => {
      if (!encJson || !eccPrivKey) return fallback;
      try {
        const bundle: ECIESCiphertext = JSON.parse(encJson);
        return decryptOrFallback(bundle, eccPrivKey, fallback);
      } catch {
        return fallback;
      }
    };

    const data = notifications.map((n: any) => {
      const title = tryDecrypt(n.title_enc, 'Notification');
      const message = tryDecrypt(n.message_enc, '');
      const actionUrl = n.actionUrl_enc ? tryDecrypt(n.actionUrl_enc, '') || undefined : undefined;

      return {
        id: n._id.toString(),
        title,
        message,
        category: n.category || 'system',
        read: n.read || false,
        actionUrl,
        createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await dbConnect();
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await req.json();

    if (action === 'MARK_READ') {
      if (id === 'ALL') {
        await Notification.updateMany({ userId }, { $set: { read: true } });
      } else {
        await Notification.updateOne({ _id: id, userId }, { $set: { read: true } });
      }
    } else if (action === 'DISMISS') {
      await Notification.deleteOne({ _id: id, userId });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Notification updated' }, { status: 200 });
  } catch (error: any) {
    console.error('PATCH /api/notifications error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
