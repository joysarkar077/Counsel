import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import { decryptOrFallback, encrypt as encryptECIES, generateKeyPair as generateECCKeyPair, type ECIESCiphertext } from '@/lib/crypto/ecc';

// encryptedPrivateKey is the raw ECC scalar hex; publicKey is the 'x,y' ECC hex.
// Profile fields are ECIES-encrypted JSON bundles — use ecc.decryptOrFallback.
function tryDecryptField(encJson: string | undefined, eccPrivKey: string | undefined, fallback: string = ''): string {
  if (!encJson || !eccPrivKey) return fallback;
  try {
    const bundle: ECIESCiphertext = JSON.parse(encJson);
    return decryptOrFallback(bundle, eccPrivKey, fallback);
  } catch {
    return fallback || encJson;
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

    const eccPrivKey = user.encryptedPrivateKey;

    const name = tryDecryptField(user.username_enc, eccPrivKey, 'User');
    const email = tryDecryptField(user.email_enc, eccPrivKey, '');
    const contact = tryDecryptField(user.contact_enc, eccPrivKey, '');
    const address = tryDecryptField(user.address_enc, eccPrivKey, '');
    const bloodGroup = tryDecryptField(user.bloodGroup_enc, eccPrivKey, '');
    const avatarKey = tryDecryptField(user.avatarKey_enc, eccPrivKey, '');

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
        publicKey: user.publicKey,
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

    // publicKey is the ECC 'x,y' hex — used directly as the recipient key for encryptECIES.
    let eccPublicKey = user.publicKey;

    // Legacy users from before the ECC migration might have an RSA JSON string in `publicKey`.
    if (!eccPublicKey || eccPublicKey.startsWith('{')) {
      const eccKeyPair = generateECCKeyPair();
      eccPublicKey = eccKeyPair.publicKey;

      // Move legacy RSA keys to their correct fields to preserve signature verification
      if (user.publicKey && user.publicKey.startsWith('{')) {
        user.rsaPublicKey = user.publicKey;
        user.rsaPrivateKey = user.encryptedPrivateKey;
      }

      user.publicKey = eccPublicKey;
      user.encryptedPrivateKey = eccKeyPair.privateKey;
    }

    // Encrypt updated fields with the user's ECC public key (matching the registration scheme)
    if (typeof name === 'string' && name.trim()) {
      user.username_enc = JSON.stringify(encryptECIES(name.trim(), eccPublicKey));
    }
    if (typeof contact === 'string' && contact.trim()) {
      user.contact_enc = JSON.stringify(encryptECIES(contact.trim(), eccPublicKey));
    }
    if (typeof address === 'string') {
      user.address_enc = JSON.stringify(encryptECIES(address.trim(), eccPublicKey));
    }
    if (typeof bloodGroup === 'string') {
      user.bloodGroup_enc = JSON.stringify(encryptECIES(bloodGroup.trim(), eccPublicKey));
    }
    if (typeof avatarKey === 'string' && avatarKey.trim()) {
      user.avatarKey_enc = JSON.stringify(encryptECIES(avatarKey.trim(), eccPublicKey));
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
