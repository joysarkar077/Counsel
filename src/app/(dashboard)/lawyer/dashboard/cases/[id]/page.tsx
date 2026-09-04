import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import { decryptText, importAESKey } from '@/lib/crypto/textCrypto';
import { CaseTabs } from '@/components/dashboard/cases/case-detail/case-tabs';
import { OverviewTab } from '@/components/dashboard/cases/case-detail/overview-tab';
import { HearingsTab } from '@/components/dashboard/cases/case-detail/hearings-tab';
import { NotesTab } from '@/components/dashboard/cases/case-detail/notes-tab';
import { PersonnelTab } from '@/components/dashboard/cases/case-detail/personnel-tab';
import { ExhibitsTab } from '@/components/dashboard/cases/case-detail/exhibits-tab';
import { MessagesTab } from '@/components/dashboard/cases/case-detail/messages-tab';
import { LawyerClientAssigner } from '@/components/dashboard/lawyer/LawyerClientAssigner';
import type { CaseStatus } from '@/types/case';

interface LawyerCaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LawyerCaseDetailPage({ params }: LawyerCaseDetailPageProps) {
  const { id } = await params;
  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    redirect('/login');
  }

  await dbConnect();

  // Fetch the case
  const caseDoc = await Case.findById(id).lean();
  if (!caseDoc) notFound();

  // Verify the lawyer has access to this case (either assigned or requested)
  const isAssigned = caseDoc.lawyerIds?.some((lId: any) => lId.toString() === userId);
  const isRequester = caseDoc.clientId?.toString() === userId;

  if (!isAssigned && !isRequester) {
    notFound(); // Hide existence of cases they don't have access to
  }

  // Fetch the lawyer's user record for decryption
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

  // Derive the shared AES case key once, used for both field decryption and messaging
  let aesKeyHex = '';
  const myAccessKey = caseDoc.accessKeys?.find((ak: any) => ak.userId.toString() === userId);
  if (myAccessKey && privateKey) {
    try {
      aesKeyHex = decrypt(myAccessKey.encryptedCaseKey, privateKey);
    } catch (err) {
      console.error('Failed to decrypt AES case key:', err);
    }
  }

  const tryDecrypt = async (encryptedJsonStr: string | undefined, fallback?: string) => {
    if (!encryptedJsonStr || !aesKeyHex) return fallback;
    try {
      const aesKey = await importAESKey(aesKeyHex);
      const payload = JSON.parse(encryptedJsonStr);
      if (!payload.ciphertextHex || !payload.ivHex) return fallback;
      return await decryptText(payload.ciphertextHex, payload.ivHex, aesKey);
    } catch {
      return fallback;
    }
  };

  // Decrypt the fields
  const title = await tryDecrypt(caseDoc.title_enc, undefined);
  const description = await tryDecrypt(caseDoc.description_enc, undefined);
  const category = await tryDecrypt(caseDoc.category_enc, undefined);
  const urgency = await tryDecrypt(caseDoc.urgency_enc, undefined);
  const jurisdiction = await tryDecrypt(caseDoc.jurisdiction_enc, undefined);
  const opposingParty = await tryDecrypt(caseDoc.opposingParty_enc, undefined);
  const claimValue = await tryDecrypt(caseDoc.claimValue_enc, undefined);
  const hearingDates = await tryDecrypt(caseDoc.hearingDates_enc, '[]');
  const jurors = await tryDecrypt(caseDoc.jurors_enc, '[]');
  const da = await tryDecrypt(caseDoc.da_enc, '{}');
  const judge = await tryDecrypt(caseDoc.judge_enc, '{}');
  const officers = await tryDecrypt(caseDoc.officers_enc, '[]');
  const witnesses = await tryDecrypt(caseDoc.witnesses_enc, '[]');
  const exhibits = await tryDecrypt(caseDoc.exhibits_enc, '[]');
  const caseUpdates = await tryDecrypt(caseDoc.caseUpdates_enc, '[]');

  // Fetch names for client and lawyers
  let clientName = caseDoc.clientId ? caseDoc.clientId.toString() : 'Unknown';
  if (caseDoc.clientId) {
    const clientUser = await User.findById(caseDoc.clientId, 'fullName').lean();
    if (clientUser && clientUser.fullName) clientName = clientUser.fullName;
  }

  let lawyerNames: string[] = [];
  if (caseDoc.lawyerIds && caseDoc.lawyerIds.length > 0) {
    const lawyers = await User.find({ _id: { $in: caseDoc.lawyerIds } }, 'fullName').lean();
    lawyerNames = lawyers.map(l => l.fullName || `Lawyer ${l._id.toString().slice(-4)}`);
  }

  return (
    <div className="animate-fade-up max-w-7xl mx-auto pb-10 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/lawyer/dashboard/cases"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Case Directory
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Case Detail
            </h1>
            <code className="text-xs font-mono text-slate-500 mt-1 block">{caseDoc._id.toString()}</code>
          </div>
          <div>
            {/* Show Add Client button at the top header */}
            <LawyerClientAssigner
              caseId={id}
              lawyerId={userId}
              encryptedCaseKey={caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId)?.encryptedCaseKey || ''}
              privateKey={privateKey}
            />
          </div>
        </div>
      </div>

      {/* Main Tabbed content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CaseTabs
          overview={
            <OverviewTab
              caseId={caseDoc.caseId || `CASE-${caseDoc._id.toString().slice(-4)}`}
              status={caseDoc.status as CaseStatus || 'PENDING_REVIEW'}
              clientId={clientName}
              lawyerIds={lawyerNames}
              createdAt={caseDoc.createdAt ? new Date(caseDoc.createdAt).toISOString() : new Date().toISOString()}
              updatedAt={caseDoc.updatedAt ? new Date(caseDoc.updatedAt).toISOString() : new Date().toISOString()}
              title={title}
              description={description}
              category={category}
              urgency={urgency}
              jurisdiction={jurisdiction}
              opposingParty={opposingParty}
              claimValue={claimValue}
            />
          }
          hearings={<HearingsTab caseId={caseDoc._id.toString()} encryptedCaseKey={caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId)?.encryptedCaseKey || ''} initialData={hearingDates || '[]'} />}
          notes={<NotesTab caseId={caseDoc._id.toString()} encryptedCaseKey={caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId)?.encryptedCaseKey || ''} initialUpdates={caseUpdates || '[]'} />}
          messages={<MessagesTab caseId={caseDoc._id.toString()} aesKeyHex={aesKeyHex} currentUserId={userId} />}
          personnel={<PersonnelTab caseId={caseDoc._id.toString()} encryptedCaseKey={caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId)?.encryptedCaseKey || ''} initialDA={da || '{}'} initialJudge={judge || '{}'} initialOfficers={officers || '[]'} initialWitnesses={witnesses || '[]'} initialJurors={jurors || '[]'} />}
          exhibits={<ExhibitsTab caseId={caseDoc._id.toString()} encryptedCaseKey={caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId)?.encryptedCaseKey || ''} initialData={exhibits || '[]'} />}
        />
      </div>

    </div>
  );
}
