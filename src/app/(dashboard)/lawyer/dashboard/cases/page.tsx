import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { decrypt as decryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';
import { CasesDirectory } from '@/components/dashboard/lawyer/CasesDirectory';
import type { ILawyerCaseItem } from '@/types/lawyer-dashboard';

export default async function LawyerCasesPage(): Promise<React.ReactNode> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    redirect('/login');
  }

  // Fetch all cases where the lawyer is either assigned or is the creator (requester)
  const caseDocs = await Case.find({
    $or: [{ lawyerIds: userId }, { clientId: userId }]
  }).sort({ updatedAt: -1 }).lean();

  // Fetch the lawyer's user record to retrieve their RSA private key for decryption
  const user = await User.findById(userId).lean();
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

      const accessKeyBundle: ECIESCiphertext = JSON.parse(myAccess.encryptedCaseKey);
      const caseKeyResult = decryptECIES(accessKeyBundle, eccPrivateKeyHex);
      if (!caseKeyResult.ok) return fallback;

      const casePrivateKeyHex = caseKeyResult.plaintext;

      const fieldBundle: ECIESCiphertext = JSON.parse(encryptedJsonStr);
      const result = decryptECIES(fieldBundle, casePrivateKeyHex);

      return result.ok ? result.plaintext : fallback;
    } catch (err) {
      return fallback;
    }
  };

  const mappedCases: ILawyerCaseItem[] = caseDocs.map((doc: any) => ({
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
  }));

  return (
    <div className="animate-fade-up space-y-8 max-w-7xl mx-auto pb-10">
      {/* Dashboard Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/70">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Case Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your assigned cases and submitted case requests.
          </p>
        </div>
        <Link
          href="/lawyer/dashboard/cases/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Request New Case File
        </Link>
      </div>

      <CasesDirectory cases={mappedCases} currentUserId={userId} />
    </div>
  );
}
