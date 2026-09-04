import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { AdminCaseAssigner } from '@/components/dashboard/admin/AdminCaseAssigner';
import { AdminClientAssigner } from '@/components/dashboard/admin/AdminClientAssigner';
import { AdminCaseStatusUpdater } from '@/components/dashboard/admin/AdminCaseStatusUpdater';
import { RemoveLawyerButton } from '@/components/dashboard/admin/RemoveLawyerButton';
import { decrypt } from '@/lib/crypto/rsa';
import { importAESKey, decryptText } from '@/lib/crypto/textCrypto';
import Link from 'next/link';
import Script from 'next/script';

export default async function AdminCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const headersList = await headers();
  let userId = headersList.get('x-user-id');

  if (!userId) {
    // TEMPORARY BYPASS FOR DEBUGGING
    userId = '6a91f0ec53d70889246688b7';
  }

  const { id } = await params;
  await dbConnect();

  const user = await User.findById(userId).lean();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <div className="p-10 text-red-500">Access Denied. You must be an Admin to view this.</div>;
  }

  const caseDoc = await Case.findById(id).lean();
  if (!caseDoc) {
    return <div className="p-10">Case not found.</div>;
  }

  // Find Admin's copy of the AES key
  const adminAccess = caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId);

  let privateKey: any = null;
  if (user && user.publicKey && user.encryptedPrivateKey) {
    const publicKey = JSON.parse(user.publicKey);
    privateKey = { d: user.encryptedPrivateKey, n: publicKey.n };
  }

  const tryDecrypt = async (encryptedJsonStr: string | undefined, fallback: string) => {
    if (!encryptedJsonStr) return `${fallback} (No JSON)`;
    if (!adminAccess) return `${fallback} (No Admin Access)`;
    if (!privateKey) return `${fallback} (No Private Key)`;
    try {
      const aesKeyHex = decrypt(adminAccess.encryptedCaseKey, privateKey);
      const aesKey = await importAESKey(aesKeyHex);
      const payload = JSON.parse(encryptedJsonStr);
      if (!payload.ciphertextHex || !payload.ivHex) return `${fallback} (Missing Payload Fields)`;
      return await decryptText(payload.ciphertextHex, payload.ivHex, aesKey);
    } catch (err: any) {
      console.error('Decryption error:', err);
      return `Error: ${err.message}`;
    }
  };

  const title = await tryDecrypt(caseDoc.title_enc, 'Encrypted Title');
  const description = await tryDecrypt(caseDoc.description_enc, 'Encrypted Description');
  const category = await tryDecrypt(caseDoc.category_enc, 'Encrypted Category');
  const urgency = await tryDecrypt(caseDoc.urgency_enc, 'Standard');
  const jurisdiction = await tryDecrypt(caseDoc.jurisdiction_enc, 'Unknown Jurisdiction');
  const opposingParty = await tryDecrypt(caseDoc.opposingParty_enc, 'Unknown');
  const claimValue = await tryDecrypt(caseDoc.claimValue_enc, 'N/A');

  // Fetch names for currently assigned lawyers
  let assignedLawyers: any[] = [];
  if (caseDoc.lawyerIds && caseDoc.lawyerIds.length > 0) {
    assignedLawyers = await User.find({ _id: { $in: caseDoc.lawyerIds } }, 'fullName').lean();
  }

  return (
    <div className="animate-fade-up max-w-5xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-core transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">
              Case Review & Assignment
            </h1>
            <code className="text-sm text-slate-500">{caseDoc.caseId}</code>
          </div>
          <AdminCaseStatusUpdater caseId={id} currentStatus={caseDoc.status} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">{title}</h2>
            <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap mb-6">
              {description}
            </div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-6 border-t border-slate-100">
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</dt>
                <dd className="text-sm font-medium text-slate-900">{category}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Urgency</dt>
                <dd className="text-sm font-medium text-slate-900 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${urgency.toLowerCase() === 'high' ? 'bg-red-500' : urgency.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                  {urgency}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Jurisdiction</dt>
                <dd className="text-sm font-medium text-slate-900">{jurisdiction}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Claim Value</dt>
                <dd className="text-sm font-medium text-slate-900">{claimValue}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Assigned Lawyers</h3>
            {assignedLawyers.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium italic">None assigned</p>
            ) : (
              <ul className="space-y-3">
                {assignedLawyers.map(l => (
                  <li key={l._id.toString()} className="flex items-center justify-between text-sm text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="font-medium">{l.fullName || `Lawyer ${l._id.toString().slice(-4)}`}</span>
                    {adminAccess && (
                      <RemoveLawyerButton caseId={id} lawyerId={l._id.toString()} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {adminAccess ? (
            <>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Assign New Attorney</h3>
                <AdminCaseAssigner 
                  caseId={id} 
                  adminId={userId} 
                  encryptedCaseKey={adminAccess.encryptedCaseKey} 
                />
              </div>
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 border-b border-slate-100 pb-2">Assign Client</h3>
              {caseDoc.clientId ? (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 flex items-center justify-between">
                  <span>Client Assigned</span>
                  <code className="text-xs">{caseDoc.clientId}</code>
                </div>
              ) : (
                <AdminClientAssigner 
                  caseId={id} 
                  adminId={userId} 
                  encryptedCaseKey={adminAccess.encryptedCaseKey} 
                />
              )}
              </div>
            </>
          ) : (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              You do not have a valid access key to read or assign this case.
            </div>
          )}
        </div>
      </div>

      {/* Script to inject private key into window just for the assignment component to use securely in memory (DO NOT DO THIS IN PRODUCTION) */}
      <Script
        id="inject-private-key"
        dangerouslySetInnerHTML={{
          __html: `window.sessionPrivateKey = ${JSON.stringify(privateKey)};`
        }}
      />
    </div>
  );
}
