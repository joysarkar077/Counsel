import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { Case } from '@/models/Case';
import { Notification } from '@/models/Notification';
import { decrypt as decryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';
import { LawyerMetrics } from '@/components/dashboard/lawyer/LawyerMetrics';
import { AssignedCasesList } from '@/components/dashboard/lawyer/AssignedCasesList';
import { RequestNewCaseCard } from '@/components/dashboard/lawyer/RequestNewCaseCard';
import { LawyerNotifications } from '@/components/dashboard/lawyer/LawyerNotifications';
import { UsefulLinks } from '@/components/dashboard/lawyer/UsefulLinks';
import type { ILawyerCaseItem, ILawyerNotification, ILawyerMetrics } from '@/types/lawyer-dashboard';

export default async function LawyerDashboardPage(): Promise<React.ReactNode> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  let isPendingLawyer = false;

  if (!userId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Unauthorized. Please sign in to access your attorney dashboard.
      </div>
    );
  }

  await dbConnect();
  const user = await User.findById(userId).lean();
  if (user && user.role === 'lawyer' && !user.isActive) {
    isPendingLawyer = true;
  }

  if (isPendingLawyer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-amber-600">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Account Pending Activation</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Your lawyer account request is currently under review by an administrator.
          You will be able to access the dashboard once your account is verified and activated.
        </p>
      </div>
    );
  }

  // Fetch assigned cases for this lawyer
  const [assignedCaseDocs, notificationDocs] = await Promise.all([
    Case.find({ lawyerIds: userId }).sort({ updatedAt: -1 }).lean(),
    Notification.find({ userId }).sort({ createdAt: -1 }).lean()
  ]);

  const eccPrivateKeyHex = user?.encryptedPrivateKey;

  const tryDecrypt = (
    encryptedJsonStr: string | undefined, 
    accessKeys: any[], 
    fallback: string
  ): string => {
    if (!encryptedJsonStr || !eccPrivateKeyHex || !accessKeys) return fallback;
    try {
      const myAccess = accessKeys.find((ak: any) => ak.userId.toString() === userId);
      if (!myAccess || !myAccess.encryptedCaseKey) return fallback;

      // 1. Decrypt the case scalar using the user's ECC private key
      const accessKeyBundle: ECIESCiphertext = JSON.parse(myAccess.encryptedCaseKey);
      const caseKeyResult = decryptECIES(accessKeyBundle, eccPrivateKeyHex);
      if (!caseKeyResult.ok) return fallback;
      
      const casePrivateKeyHex = caseKeyResult.plaintext;

      // 2. Decrypt the field using the case scalar
      const fieldBundle: ECIESCiphertext = JSON.parse(encryptedJsonStr);
      const result = decryptECIES(fieldBundle, casePrivateKeyHex);
      
      return result.ok ? result.plaintext : fallback;
    } catch {
      return fallback;
    }
  };

  const mapCaseDoc = (doc: any): ILawyerCaseItem => ({
    id: doc._id.toString(),
    caseId: doc.caseId || `CASE-${doc._id.toString().slice(-4)}`,
    clientId: doc.clientId ? doc.clientId.toString() : 'Unknown',
    title: tryDecrypt(doc.title_enc, doc.accessKeys, 'Encrypted Legal Case'),
    category: tryDecrypt(doc.category_enc, doc.accessKeys, 'Encrypted Category'),
    status: doc.status || 'PENDING_REVIEW',
    urgency: tryDecrypt(doc.urgency_enc, doc.accessKeys, 'Standard'),
    jurisdiction: tryDecrypt(doc.jurisdiction_enc, doc.accessKeys, 'District Court'),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  });

  const assignedCases = assignedCaseDocs.map(mapCaseDoc);
  const activeCasesCount = assignedCases.filter((c) => c.status === 'ACTIVE').length;

  const notifications: ILawyerNotification[] = notificationDocs.map((doc: any) => ({
    id: doc._id.toString(),
    title: doc.title_enc ? 'Encrypted Notification' : 'Notification',
    message: doc.message_enc ? 'Encrypted content...' : '',
    timestamp: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date',
    category: doc.category || 'system',
    read: doc.read || false,
    actionUrl: doc.actionUrl_enc ? '#' : undefined,
  }));

  const metrics: ILawyerMetrics = {
    assignedCasesCount: assignedCases.length,
    activeCasesCount,
    unreadNotificationsCount: notifications.filter((n) => !n.read).length,
    recentUpdatesCount: assignedCases.length,
  };

  return (
    <div className="animate-fade-up space-y-8 max-w-7xl mx-auto pb-10">
      {/* Dashboard Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Attorney Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Summary of your assigned client cases, activities, and case requests.
          </p>
        </div>
        <Link
          href="/client/dashboard/cases/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Request New Case File
        </Link>
      </div>

      {/* Metrics Row */}
      <LawyerMetrics metrics={metrics} />

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Assigned Cases & New Case File Action */}
        <div className="lg:col-span-2 space-y-6">
          <AssignedCasesList cases={assignedCases} />
          <RequestNewCaseCard recentAssignments={assignedCases} />
        </div>

        {/* Right Column: Notifications & Useful Links */}
        <div className="space-y-6">
          <LawyerNotifications initialNotifications={notifications} />
          <UsefulLinks />
        </div>
      </div>
    </div>
  );
}
