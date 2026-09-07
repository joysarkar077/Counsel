import { getDecryptedKeys } from '@/lib/auth/getDecryptedKeys';
import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decryptOrFallback, type ECIESCiphertext } from '@/lib/crypto/ecc';
import EditProfileForm from './EditProfileForm';

export default async function EditProfilePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  let decryptedName = '';
  let decryptedEmail = '';
  let decryptedContact = '';
  let decryptedAddress = '';
  let decryptedBloodGroup = 'O+';
  let decryptedAvatarKey = '';
  let avatarUrl = '';
  let position = 'Lawyer';

  if (userId) {
    await dbConnect();
    const user = await User.findById(userId).lean();
    if (user) {
      try {
        // encryptedPrivateKey is the raw ECC scalar hex.
        // Profile fields are ECIES-encrypted JSON bundles — use ecc.decryptOrFallback.
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

        decryptedName = tryDecrypt(user.username_enc, '');
        decryptedEmail = tryDecrypt(user.email_enc, '');
        decryptedContact = tryDecrypt(user.contact_enc, '');
        decryptedAddress = tryDecrypt(user.address_enc, '');
        decryptedBloodGroup = tryDecrypt(user.bloodGroup_enc, 'O+');
        decryptedAvatarKey = tryDecrypt(user.avatarKey_enc, '');
        avatarUrl = user.avatarUrl || '';
        position = user.position || 'Lawyer';
      } catch (err) {
        console.error('Error decrypting user profile data:', err);
      }
    }
  }

  const initialData = {
    name: decryptedName,
    email: decryptedEmail,
    contact: decryptedContact,
    address: decryptedAddress,
    bloodGroup: decryptedBloodGroup,
    position: position,
    avatarUrl,
    avatarKey: decryptedAvatarKey,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      <div className="flex items-center gap-4 pb-4 border-b border-slate-200/60">
        <Link href="/lawyer/dashboard/profile" className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Update your professional information.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-subtle border border-slate-200/60 overflow-hidden">
        <EditProfileForm initialData={initialData} />
      </div>
    </div>
  );
}
