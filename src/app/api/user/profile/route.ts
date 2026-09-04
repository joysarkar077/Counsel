import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { encrypt, decrypt, RSAPrivateKey, generateKeyPair } from '@/lib/crypto/rsa';

function tryDecryptField(encVal: string | undefined, privateKey: RSAPrivateKey | null, fallback: string = ''): string {
  if (!encVal || !privateKey) return fallback;
  try {
    return decrypt(encVal, privateKey);
  } catch {
    return fallback || encVal;
  }
}

export async function GET(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    let privateKey: RSAPrivateKey | null = null;
    if (user.publicKey && user.encryptedPrivateKey) {
      try {
        const pub = typeof user.publicKey === 'string' ? JSON.parse(user.publicKey) : user.publicKey;
        privateKey = { d: user.encryptedPrivateKey, n: pub.n };
      } catch (err) {
        console.error('Failed to parse RSA key for user profile GET:', err);
      }
    }

    const name = tryDecryptField(user.username_enc, privateKey, 'User');
    const email = tryDecryptField(user.email_enc, privateKey, '');
    const contact = tryDecryptField(user.contact_enc, privateKey, '');
    const address = tryDecryptField(user.address_enc, privateKey, '');
    const bloodGroup = tryDecryptField(user.bloodGroup_enc, privateKey, '');
    const avatarKey = tryDecryptField(user.avatarKey_enc, privateKey, '');

    return NextResponse.json({
      success: true,
      data: {
        id: user._id.toString(),
        name,
        email,
        contact,
        address,
        bloodGroup,
        avatarUrl: user.avatarUrl || '',
        avatarKey: avatarKey || '',
        position: user.position || user.role,
        role: user.role,
        isActive: user.isActive,
        publicKey: typeof user.publicKey === 'string' ? user.publicKey : JSON.stringify(user.publicKey),
        createdAt: user.createdAt,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('GET /api/user/profile error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, contact, address, bloodGroup, avatarUrl, avatarKey } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Ensure user has valid RSA keypair
    let publicKeyObj: any = null;
    if (user.publicKey) {
      try {
        publicKeyObj = typeof user.publicKey === 'string' ? JSON.parse(user.publicKey) : user.publicKey;
      } catch (err) {
        console.error('Parsing existing user public key failed:', err);
      }
    }

    if (!publicKeyObj || !publicKeyObj.e || !publicKeyObj.n) {
      const keys = generateKeyPair(1024);
      publicKeyObj = keys.publicKey;
      user.publicKey = JSON.stringify(keys.publicKey);
      user.encryptedPrivateKey = keys.privateKey.d;
    }

    // Encrypt fields with public key
    if (typeof name === 'string' && name.trim()) {
      user.username_enc = encrypt(name.trim(), publicKeyObj);
    }
    if (typeof contact === 'string' && contact.trim()) {
      user.contact_enc = encrypt(contact.trim(), publicKeyObj);
    }
    if (typeof address === 'string') {
      user.address_enc = encrypt(address.trim(), publicKeyObj);
    }
    if (typeof bloodGroup === 'string') {
      user.bloodGroup_enc = encrypt(bloodGroup.trim(), publicKeyObj);
    }
    if (typeof avatarKey === 'string' && avatarKey.trim()) {
      user.avatarKey_enc = encrypt(avatarKey.trim(), publicKeyObj);
    }
    if (typeof avatarUrl === 'string') {
      user.avatarUrl = avatarUrl;
    }

    await user.save();

    return NextResponse.json({ success: true, message: 'Profile updated successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/user/profile error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
