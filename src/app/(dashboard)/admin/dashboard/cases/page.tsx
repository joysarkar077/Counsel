import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import { decryptText, importAESKey } from '@/lib/crypto/textCrypto';
import { AdminCasesTable } from '@/components/dashboard/admin/AdminCasesTable';
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

  let privateKey: any = null;
  if (user && user.publicKey && user.encryptedPrivateKey) {
    try {
      const publicKey = JSON.parse(user.publicKey);
      privateKey = { d: user.encryptedPrivateKey, n: publicKey.n };
    } catch (err) {
      console.error('Failed to parse admin RSA keys:', err);
    }
  }

  const tryDecrypt = async (
    encryptedJsonStr: string | undefined, 
    accessKeys: any[], 
    fallback: string
  ) => {
    if (!encryptedJsonStr || !privateKey || !accessKeys) return fallback;
    try {
      const adminAccess = accessKeys.find((ak: any) => ak.userId.toString() === userId);
      if (!adminAccess) return fallback;

      const aesKeyHex = decrypt(adminAccess.encryptedCaseKey, privateKey);
      const aesKey = await importAESKey(aesKeyHex);

      const payload = JSON.parse(encryptedJsonStr);
      if (!payload.ciphertextHex || !payload.ivHex) return fallback;

      return await decryptText(payload.ciphertextHex, payload.ivHex, aesKey);
    } catch (err) {
      return fallback;
    }
  };

  const mappedCases: ILawyerCaseItem[] = await Promise.all(caseDocs.map(async (doc: any) => ({
    id: doc._id.toString(),
    caseId: doc.caseId || `CASE-${doc._id.toString().slice(-4)}`,
    clientId: doc.clientId ? doc.clientId.toString() : 'Unknown',
    title: await tryDecrypt(doc.title_enc, doc.accessKeys, 'Encrypted Legal Case'),
    category: await tryDecrypt(doc.category_enc, doc.accessKeys, 'Encrypted Category'),
    status: doc.status || 'PENDING_REVIEW',
    urgency: await tryDecrypt(doc.urgency_enc, doc.accessKeys, 'Standard'),
    jurisdiction: await tryDecrypt(doc.jurisdiction_enc, doc.accessKeys, 'District Court'),
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  })));

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
      </div>

      <AdminCasesTable cases={mappedCases} />
    </div>
  );
}
