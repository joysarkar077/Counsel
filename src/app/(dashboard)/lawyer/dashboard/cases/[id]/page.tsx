import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { headers } from 'next/headers';
import dbConnect from '@/lib/db/mongoose';
import { Case } from '@/models/Case';
import { User } from '@/models/User';
import { decrypt as decryptECIES, type ECIESCiphertext } from '@/lib/crypto/ecc';
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

  // Verify the lawyer has access to this case
  const isAssigned = caseDoc.lawyerIds?.some((lId: any) => lId.toString() === userId);
  const isRequester = caseDoc.clientId?.toString() === userId;

  if (!isAssigned && !isRequester) {
    notFound();
  }

  // Fetch the lawyer's ECC private key for decryption
  const user = await User.findById(userId).lean();
  const eccPrivateKeyHex: string = user?.encryptedPrivateKey ?? '';

  /**
   * Step 1: Decrypt the case access key to obtain the case ECC private scalar.
   * accessKey.encryptedCaseKey is a JSON-serialised ECIESCiphertext bundle
   * wrapping the case private scalar, encrypted to this user's ECC public key.
   */
  let casePrivateKeyHex = '';
  const myAccessKey = caseDoc.accessKeys?.find((ak: any) => ak.userId.toString() === userId);
  if (myAccessKey?.encryptedCaseKey && eccPrivateKeyHex) {
    try {
      const accessKeyBundle: ECIESCiphertext = JSON.parse(myAccessKey.encryptedCaseKey);
      const result = decryptECIES(accessKeyBundle, eccPrivateKeyHex);
      if (result.ok) {
        casePrivateKeyHex = result.plaintext;
      } else {
        console.error('Failed to decrypt case access key:', result.error);
      }
    } catch (err) {
      console.error('Exception while decrypting case access key:', err);
    }
  }

  /**
   * Step 2: Decrypt each *_enc field using the case private key scalar.
   * Each field is a JSON-serialised ECIESCiphertext bundle.
   */
  const tryDecrypt = (encryptedJsonStr: string | undefined, fallback?: string): string | undefined => {
    if (!encryptedJsonStr || !casePrivateKeyHex) return fallback;
    try {
      const bundle: ECIESCiphertext = JSON.parse(encryptedJsonStr);
      const result = decryptECIES(bundle, casePrivateKeyHex);
      return result.ok ? result.plaintext : fallback;
    } catch {
      return fallback;
    }
  };

  const title = tryDecrypt(caseDoc.title_enc, undefined);
  const description = tryDecrypt(caseDoc.description_enc, undefined);
  const category = tryDecrypt(caseDoc.category_enc, undefined);
  const urgency = tryDecrypt(caseDoc.urgency_enc, undefined);
  const jurisdiction = tryDecrypt(caseDoc.jurisdiction_enc, undefined);
  const opposingParty = tryDecrypt(caseDoc.opposingParty_enc, undefined);
  const claimValue = tryDecrypt(caseDoc.claimValue_enc, undefined);
  const hearingDates = tryDecrypt(caseDoc.hearingDates_enc, '[]');
  const jurors = tryDecrypt(caseDoc.jurors_enc, '[]');
  const da = tryDecrypt(caseDoc.da_enc, '{}');
  const judge = tryDecrypt(caseDoc.judge_enc, '{}');
  const officers = tryDecrypt(caseDoc.officers_enc, '[]');
  const witnesses = tryDecrypt(caseDoc.witnesses_enc, '[]');
  const exhibits = tryDecrypt(caseDoc.exhibits_enc, '[]');
  const caseUpdates = tryDecrypt(caseDoc.caseUpdates_enc, '[]');

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

  const casePublicKey: string = caseDoc.casePublicKey ?? '';

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
            <LawyerClientAssigner
              caseId={id}
              lawyerId={userId}
              encryptedCaseKey={caseDoc.accessKeys.find((ak: any) => ak.userId.toString() === userId)?.encryptedCaseKey || ''}
              privateKey={{ d: eccPrivateKeyHex }}
            />
          </div>
        </div>
      </div>

      {/* Main Tabbed content */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <CaseTabs
          caseId={caseDoc._id.toString()}
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
          hearings={
            <HearingsTab
              caseId={caseDoc._id.toString()}
              casePrivateKeyHex={casePrivateKeyHex}
              casePublicKey={casePublicKey}
              initialData={hearingDates || '[]'}
            />
          }
          notes={
            <NotesTab
              caseId={caseDoc._id.toString()}
              casePrivateKeyHex={casePrivateKeyHex}
              casePublicKey={casePublicKey}
              initialUpdates={caseUpdates || '[]'}
            />
          }
          messages={
            <MessagesTab
              caseId={caseDoc._id.toString()}
              casePrivateKeyHex={casePrivateKeyHex}
              casePublicKey={casePublicKey}
              currentUserId={userId}
              senderPrivateKeyHex={eccPrivateKeyHex}
            />
          }
          personnel={
            <PersonnelTab
              caseId={caseDoc._id.toString()}
              casePrivateKeyHex={casePrivateKeyHex}
              casePublicKey={casePublicKey}
              initialDA={da || '{}'}
              initialJudge={judge || '{}'}
              initialOfficers={officers || '[]'}
              initialWitnesses={witnesses || '[]'}
              initialJurors={jurors || '[]'}
            />
          }
          exhibits={
            <ExhibitsTab
              caseId={caseDoc._id.toString()}
              casePrivateKeyHex={casePrivateKeyHex}
              casePublicKey={casePublicKey}
              initialData={exhibits || '[]'}
            />
          }
        />
      </div>

    </div>
  );
}
