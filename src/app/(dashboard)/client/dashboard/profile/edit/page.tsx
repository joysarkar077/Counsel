import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import { EditClientProfileForm } from './EditClientProfileForm';

export default async function EditClientProfilePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Unauthorized. Please sign in to edit your profile.
      </div>
    );
  }

  await dbConnect();
  const user = await User.findById(userId).lean();

  if (!user) {
    return (
      <div className="p-8 text-center text-slate-500">
        User account not found.
      </div>
    );
  }

  let privateKey: any = null;
  if (user.publicKey && user.encryptedPrivateKey) {
    try {
      const pub = JSON.parse(user.publicKey);
      privateKey = { d: user.encryptedPrivateKey, n: pub.n };
    } catch (err) {
      console.error('Failed to parse RSA key on Edit Profile page:', err);
    }
  }

  const tryDecrypt = (encVal: string | undefined, fallback: string): string => {
    if (!encVal || !privateKey) return fallback;
    try {
      return decrypt(encVal, privateKey);
    } catch {
      return fallback || encVal;
    }
  };

  const initialData = {
    name: tryDecrypt(user.username_enc, ''),
    email: tryDecrypt(user.email_enc, ''),
    contact: tryDecrypt(user.contact_enc, ''),
    address: tryDecrypt(user.address_enc, ''),
    bloodGroup: tryDecrypt(user.bloodGroup_enc, ''),
    avatarUrl: user.avatarUrl || '',
    avatarKey: tryDecrypt(user.avatarKey_enc, ''),
  };

  return (
    <div className="animate-fade-up max-w-2xl mx-auto space-y-6 pb-10">
      <div className="pb-4 border-b border-slate-200/70">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Profile Information</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Update your personal details. Images are client-side encrypted before upload.
        </p>
      </div>

      <div className="bg-white border border-slate-200/70 shadow-sm rounded-xl p-6 sm:p-8">
        <EditClientProfileForm initialData={initialData} />
      </div>
    </div>
  );
}
