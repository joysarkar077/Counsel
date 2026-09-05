import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { Case } from '@/models/Case';
import { decrypt as decryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';
import { CasesList } from '@/components/dashboard/cases/cases-list';

export default async function ClientCasesPage() {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    return (
      <div className="p-8 text-center text-slate-500">
        Unauthorized. Please sign in to view your cases.
      </div>
    );
  }

  await dbConnect();

  const [userDoc, caseDocs] = await Promise.all([
    User.findById(userId).lean(),
    Case.find({ clientId: userId }).sort({ createdAt: -1 }).lean(),
  ]);

  const eccPrivateKeyHex = userDoc?.encryptedPrivateKey;

  const tryDecryptCaseField = (
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
    } catch {
      return fallback;
    }
  };

  const cases = caseDocs.map((doc: any) => ({
    id: doc._id.toString(),
    title: tryDecryptCaseField(doc.title_enc, doc.accessKeys, 'Encrypted Legal Case'),
    status: (doc.status || 'PENDING_REVIEW') as any,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="animate-fade-up space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and view your encrypted legal cases.</p>
        </div>

        <Link
          href="/client/dashboard/cases/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Case Request
        </Link>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-subtle p-6">
        <CasesList cases={cases} />
      </div>
    </div>
  );
}
