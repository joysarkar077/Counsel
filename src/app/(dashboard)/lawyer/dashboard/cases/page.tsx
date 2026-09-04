import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import { decryptText, importAESKey } from '@/lib/crypto/textCrypto';
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
  let privateKey: any = null;
  if (user && user.publicKey && user.encryptedPrivateKey) {
    try {
      const publicKey = JSON.parse(user.publicKey);
      privateKey = { d: user.encryptedPrivateKey, n: publicKey.n };
    } catch (err) {
      console.error('Failed to parse lawyer RSA keys:', err);
    }
  }

  const tryDecrypt = async (
    encryptedJsonStr: string | undefined, 
    accessKeys: any[], 
    fallback: string
  ) => {
    if (!encryptedJsonStr || !privateKey || !accessKeys) return fallback;
    try {
      // Find the user's encrypted AES key
      const myAccess = accessKeys.find((ak: any) => ak.userId.toString() === userId);
      if (!myAccess) return fallback;

      // Decrypt the AES key with RSA private key
      const aesKeyHex = decrypt(myAccess.encryptedCaseKey, privateKey);
      const aesKey = await importAESKey(aesKeyHex);

      // Parse the AES ciphertext payload
      const payload = JSON.parse(encryptedJsonStr);
      if (!payload.ciphertextHex || !payload.ivHex) return fallback;

      // Decrypt the actual data
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
