import dbConnect from '@/lib/db/mongoose';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { decrypt, RSAPrivateKey } from '@/lib/crypto/rsa';

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

    let privateKey: RSAPrivateKey | null = null;
    if (user && user.publicKey && user.encryptedPrivateKey) {
      try {
        const pub = JSON.parse(user.publicKey);
        privateKey = { d: user.encryptedPrivateKey, n: pub.n };
      } catch (err) {
        console.error('Failed to parse RSA key for notifications:', err);
      }
    }

    const data = notifications.map((n: any) => {
      let title = 'Notification';
      let message = '';
      let actionUrl: string | undefined = undefined;

      if (privateKey && n.title_enc) {
        try { title = decrypt(n.title_enc, privateKey); } catch { title = n.title_enc; }
      } else if (n.title_enc) {
        title = n.title_enc;
      }

      if (privateKey && n.message_enc) {
        try { message = decrypt(n.message_enc, privateKey); } catch { message = n.message_enc; }
      } else if (n.message_enc) {
        message = n.message_enc;
      }

      if (privateKey && n.actionUrl_enc) {
        try { actionUrl = decrypt(n.actionUrl_enc, privateKey); } catch { actionUrl = n.actionUrl_enc; }
      }

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
