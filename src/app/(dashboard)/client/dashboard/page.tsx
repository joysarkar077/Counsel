import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { Case } from '@/models/Case';
import { Notification } from '@/models/Notification';
import { decrypt } from '@/lib/crypto/rsa';
import { decryptText, importAESKey } from '@/lib/crypto/textCrypto';
import { ClientNotifications, ClientNotificationItem } from '@/components/dashboard/client/ClientNotifications';
import EncryptedImage from '@/components/ui/EncryptedImage';

export default async function ClientDashboardPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Unauthorized. Please sign in to access your dashboard.
      </div>
    );
  }

  await dbConnect();

  // Fetch real user, cases, and notifications parallelly from MongoDB
  const [userDoc, caseDocs, notificationDocs] = await Promise.all([
    User.findById(userId).lean(),
    Case.find({ clientId: userId }).sort({ updatedAt: -1 }).lean(),
    Notification.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!userDoc) {
    return (
      <div className="p-8 text-center text-slate-500">
        User account not found.
      </div>
    );
  }

  // Parse RSA private key if available for decrypting encrypted user profile & case fields
  let privateKey: any = null;
  if (userDoc.publicKey && userDoc.encryptedPrivateKey) {
    try {
      const pub = JSON.parse(userDoc.publicKey);
      privateKey = { d: userDoc.encryptedPrivateKey, n: pub.n };
    } catch (err) {
      console.error('Failed to parse RSA key:', err);
    }
  }

  // Helper to safely decrypt RSA encrypted profile fields
  const tryDecryptProfileField = (encVal: string | undefined, fallback: string): string => {
    if (!encVal || !privateKey) return fallback;
    try {
      return decrypt(encVal, privateKey);
    } catch {
      return fallback || encVal;
    }
  };

  // Helper to decrypt AES encrypted case fields
  const tryDecryptCaseField = async (
    encryptedJsonStr: string | undefined,
    accessKeys: any[],
    fallback: string
  ): Promise<string> => {
    if (!encryptedJsonStr || !privateKey || !accessKeys) return fallback;
    try {
      const myAccess = accessKeys.find((ak: any) => ak.userId.toString() === userId);
      if (!myAccess) return fallback;

      const aesKeyHex = decrypt(myAccess.encryptedCaseKey, privateKey);
      const aesKey = await importAESKey(aesKeyHex);

      const payload = JSON.parse(encryptedJsonStr);
      if (!payload.ciphertextHex || !payload.ivHex) return fallback;

      return await decryptText(payload.ciphertextHex, payload.ivHex, aesKey);
    } catch {
      return fallback;
    }
  };

  // Decrypt user profile information
  const name = tryDecryptProfileField(userDoc.username_enc, 'Client User');
  const email = tryDecryptProfileField(userDoc.email_enc, 'No email provided');
  const contact = tryDecryptProfileField(userDoc.contact_enc, 'No contact provided');
  const address = tryDecryptProfileField(userDoc.address_enc, 'Not specified');
  const bloodGroup = tryDecryptProfileField(userDoc.bloodGroup_enc, 'Not specified');
  const avatarKey = tryDecryptProfileField(userDoc.avatarKey_enc, '');

  // Process live cases from DB
  const cases = await Promise.all(
    caseDocs.map(async (doc: any) => ({
      id: doc._id.toString(),
      caseId: doc.caseId || `CASE-${doc._id.toString().slice(-4)}`,
      title: await tryDecryptCaseField(doc.title_enc, doc.accessKeys, 'Encrypted Legal Case'),
      category: await tryDecryptCaseField(doc.category_enc, doc.accessKeys, 'Encrypted Category'),
      status: doc.status || 'PENDING_REVIEW',
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : 'Recent',
      createdAt: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Recent',
    }))
  );

  // Process live notifications from DB
  const notifications: ClientNotificationItem[] = notificationDocs.map((doc: any) => {
    let title = 'Notification';
    let message = '';
    if (privateKey && doc.title_enc) {
      try { title = decrypt(doc.title_enc, privateKey); } catch { title = 'Case Activity Update'; }
    }
    if (privateKey && doc.message_enc) {
      try { message = decrypt(doc.message_enc, privateKey); } catch { message = 'Your case status was updated.'; }
    }

    return {
      id: doc._id.toString(),
      title: doc.title_enc ? title : 'Notification',
      message: doc.message_enc ? message : 'System update',
      category: doc.category || 'system',
      read: doc.read || false,
      actionUrl: doc.actionUrl_enc ? '/client/dashboard/cases' : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  const activeCasesCount = cases.filter((c) => c.status === 'ACTIVE' || c.status === 'PENDING_REVIEW').length;
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="animate-fade-up space-y-8 max-w-7xl mx-auto pb-10">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Client Workspace</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back, {name}. View your encrypted cases and manage profile details.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/client/dashboard/profile/edit"
            className="inline-flex items-center justify-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-500">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Profile
          </Link>

          <Link
            href="/client/dashboard/cases/new"
            className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Submit New Case
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Cases</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">{cases.length}</span>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 rounded-full">
              {activeCasesCount} active / pending
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Notifications</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">{notifications.length}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full">
              {unreadNotificationsCount} unread
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/70 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Security Status</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              RSA-2048 Active
            </span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              E2EE
            </span>
          </div>
        </div>
      </div>

      {/* Profile & Main Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Profile Information Card & Live Cases List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center">
                  {userDoc.avatarUrl && avatarKey ? (
                    <EncryptedImage
                      url={userDoc.avatarUrl}
                      avatarKeyHex={avatarKey}
                      className="w-full h-full"
                    />
                  ) : userDoc.avatarUrl ? (
                    <img
                      src={userDoc.avatarUrl}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 text-white font-extrabold text-xl flex items-center justify-center">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">{name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-slate-500">{email}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {userDoc.role || 'client'}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/client/dashboard/profile/edit"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 border border-blue-200 bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                <span>Edit Info</span>
                <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-400 block uppercase text-[10px] tracking-wider mb-1">Contact Number</span>
                <span className="font-medium text-slate-800">{contact || 'Not provided'}</span>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-400 block uppercase text-[10px] tracking-wider mb-1">Address</span>
                <span className="font-medium text-slate-800">{address || 'Not specified'}</span>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-400 block uppercase text-[10px] tracking-wider mb-1">Blood Group</span>
                <span className="font-medium text-slate-800">{bloodGroup || 'Not specified'}</span>
              </div>

              <div className="p-3.5 bg-slate-50/70 rounded-lg border border-slate-100">
                <span className="font-semibold text-slate-400 block uppercase text-[10px] tracking-wider mb-1">Account Created</span>
                <span className="font-medium text-slate-800">
                  {userDoc.createdAt ? new Date(userDoc.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Case List Card */}
          <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Your Legal Cases</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status of your active and pending cases.</p>
              </div>

              <Link
                href="/client/dashboard/cases"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                View all ({cases.length}) →
              </Link>
            </div>

            {cases.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <p className="text-sm text-slate-500 font-medium">No legal cases found in your account.</p>
                <Link
                  href="/client/dashboard/cases/new"
                  className="inline-block text-xs font-semibold text-blue-600 hover:underline"
                >
                  Create your first case request →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {cases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/client/dashboard/cases/${c.id}`}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 transition-all group"
                  >
                    <div className="space-y-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold font-mono text-slate-400">{c.caseId}</span>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {c.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Category: <strong className="font-semibold text-slate-700">{c.category}</strong></span>
                        <span>•</span>
                        <span>Updated: {c.updatedAt}</span>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : c.status === 'PENDING_REVIEW'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Notifications */}
        <div className="space-y-6">
          <ClientNotifications initialNotifications={notifications} />
        </div>
      </div>
    </div>
  );
}
