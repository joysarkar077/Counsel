import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
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
        const publicKey = JSON.parse(user.publicKey);
        const privateKey = { d: user.encryptedPrivateKey, n: publicKey.n };
        
        decryptedName = decrypt(user.username_enc, privateKey);
        decryptedEmail = decrypt(user.email_enc, privateKey);
        decryptedContact = user.contact_enc ? decrypt(user.contact_enc, privateKey) : '';
        decryptedAddress = user.address_enc ? decrypt(user.address_enc, privateKey) : '';
        decryptedBloodGroup = user.bloodGroup_enc ? decrypt(user.bloodGroup_enc, privateKey) : 'O+';
        if (user.avatarKey_enc) decryptedAvatarKey = decrypt(user.avatarKey_enc, privateKey);
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
