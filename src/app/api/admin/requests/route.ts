import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt as decryptECIES, ECIESCiphertext } from '@/lib/crypto/ecc';

export async function GET() {
  try {
    const headersList = await headers();
    const userRole = headersList.get('x-user-role');

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await dbConnect();
    
    // Fetch lawyers who are pending activation
    const dbRequests = await User.find({ role: 'lawyer', isActive: false })
      .select('_id fullName email_enc contact_enc encryptedPrivateKey createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const requests = dbRequests.map((user) => {
      let email = 'Unknown';
      let contact = 'Unknown';
      
      if (user.encryptedPrivateKey) {
        try {
          if (user.email_enc) {
            const emailBundle: ECIESCiphertext = JSON.parse(user.email_enc);
            const res = decryptECIES(emailBundle, user.encryptedPrivateKey);
            if (res.ok) email = res.plaintext;
          }
          if (user.contact_enc) {
            const contactBundle: ECIESCiphertext = JSON.parse(user.contact_enc);
            const res = decryptECIES(contactBundle, user.encryptedPrivateKey);
            if (res.ok) contact = res.plaintext;
          }
        } catch (e) {
          // ignore parsing errors
        }
      }

      return {
        _id: user._id.toString(),
        fullName: user.fullName,
        email,
        contact,
        createdAt: user.createdAt,
      };
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching admin requests:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
