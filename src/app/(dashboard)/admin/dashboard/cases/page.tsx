import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { decrypt as decryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';
import { AdminCasesTable } from '@/components/dashboard/admin/AdminCasesTable';
import { AdminCreateCaseButton } from '@/components/dashboard/admin/AdminCreateCaseButton';
import type { ILawyerCaseItem } from '@/types/lawyer-dashboard';

export default async function AdminCasesPage(): Promise<React.ReactNode> {
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    redirect('/login');
  }

  await dbConnect();
  
  // Verify Admin
  const user = await User.findById(userId).lean();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <div className="p-10 text-red-500">Access Denied. You must be an Admin to view this.</div>;
  }

  // Fetch all cases for Admin
  const caseDocs = await Case.find({}).sort({ updatedAt: -1 }).lean();

  const eccPrivateKeyHex = user?.encryptedPrivateKey;

  const tryDecrypt = (
    encryptedJsonStr: string | undefined, 
    accessKeys: any[], 
    fallback: string
  ): string => {
    if (!encryptedJsonStr || !eccPrivateKeyHex || !accessKeys) return fallback;
    try {
      const adminAccess = accessKeys.find((ak: any) => ak.userId.toString() === userId);
      if (!adminAccess || !adminAccess.encryptedCaseKey) return fallback;

      const accessKeyBundle: ECIESCiphertext = JSON.parse(adminAccess.encryptedCaseKey);
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
          <h1 className="text-[1.8rem] font-extrabold tracking-tight text-navy-deepest mb-1">Platform Cases</h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitor and assign all incoming and active cases across the platform.
          </p>
        </div>
        <AdminCreateCaseButton />
      </div>

      <AdminCasesTable cases={mappedCases} />
    </div>
  );
}
