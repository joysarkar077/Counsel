import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import EncryptedImage from '@/components/ui/EncryptedImage';

export default async function AdminProfilePage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Unauthorized. Please sign in to access your admin profile.
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
      console.error('Failed to parse RSA key on Admin Profile page:', err);
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

  const name = tryDecrypt(user.username_enc, 'Administrator');
  const email = tryDecrypt(user.email_enc, 'admin@counsel.com');
  const contact = tryDecrypt(user.contact_enc, 'Not provided');
  const address = tryDecrypt(user.address_enc, 'Not specified');
  const bloodGroup = tryDecrypt(user.bloodGroup_enc, 'Not specified');
  const avatarKey = tryDecrypt(user.avatarKey_enc, '');

  return (
    <div className="animate-fade-up max-w-4xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Profile</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage administrator credentials and account security.</p>
        </div>

        <Link
          href="/admin/dashboard/profile/edit"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit Profile Information
        </Link>
      </div>

      {/* Overview Card */}
      <div className="bg-white border border-slate-200/70 shadow-sm rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 shadow-sm flex items-center justify-center">
              {user.avatarUrl && avatarKey ? (
                <EncryptedImage
                  url={user.avatarUrl}
                  avatarKeyHex={avatarKey}
                  className="w-full h-full"
                />
              ) : user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">{name}</h2>
              <p className="text-xs font-medium text-slate-500">{email}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Role: {user.role}
                </span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  System Active
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/admin/dashboard/profile/edit"
            className="text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 text-xs">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contact Number</span>
            <p className="text-sm font-semibold text-slate-800">{contact}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Address</span>
            <p className="text-sm font-semibold text-slate-800">{address}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blood Group</span>
            <p className="text-sm font-semibold text-slate-800">{bloodGroup}</p>
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Created At</span>
            <p className="text-sm font-semibold text-slate-800">
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
