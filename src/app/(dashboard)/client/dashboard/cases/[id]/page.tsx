import { getDecryptedKeys } from '@/lib/auth/getDecryptedKeys';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { CaseTabs } from '@/components/dashboard/cases/case-detail/case-tabs';
import { OverviewTab } from '@/components/dashboard/cases/case-detail/overview-tab';
import { HearingsTab } from '@/components/dashboard/cases/case-detail/hearings-tab';
import { NotesTab } from '@/components/dashboard/cases/case-detail/notes-tab';
import { ExhibitsTab } from '@/components/dashboard/cases/case-detail/exhibits-tab';
import { ClientDocumentsTab } from '@/components/dashboard/cases/case-detail/client-documents-tab';
import { MessagesTab } from '@/components/dashboard/cases/case-detail/messages-tab';
import type { CaseStatus } from '@/types/case';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { Case } from '@/models/Case';
import { decrypt as decryptECIES, decryptOrFallback, type ECIESCiphertext } from '@/lib/crypto/ecc';

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  await dbConnect();
  const caseData = await Case.findById(id).lean();
  if (!caseData) notFound();

  // Fetch the user's ECC keys for decryption
  await dbConnect();

  const headersList = await headers();
  const userId = headersList.get('x-user-id');

  if (!userId) {
    redirect('/login');
  }

  const user = await User.findById(userId).lean();
  const { eccPrivateKey: eccPrivateKeyHex, rsaPrivateKey: rsaPrivateKeyFromSession } = await getDecryptedKeys();

  /**
   * Step 1: Decrypt the user's accessKey to get the case private scalar.
   * The accessKey is a JSON-serialised ECIESCiphertext bundle wrapping the case ECC private key.
   */
  let casePrivateKeyHex = '';
  const myAccessKey = caseData.accessKeys?.find((ak: any) => ak.userId?.toString() === userId);
  if (myAccessKey?.encryptedCaseKey && eccPrivateKeyHex) {
    try {
      const accessKeyBundle: ECIESCiphertext = JSON.parse(myAccessKey.encryptedCaseKey);
      const accessKeyResult = decryptECIES(accessKeyBundle, eccPrivateKeyHex);
      if (accessKeyResult.ok) {
        casePrivateKeyHex = accessKeyResult.plaintext;
      }
    } catch (err) {
      console.error('Failed to decrypt case access key:', err);
    }
  }

  /**
   * Step 2: Decrypt each case field using the case private key scalar.
   * Each *_enc field is a JSON-serialised ECIESCiphertext bundle.
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

  const title = tryDecrypt(caseData.title_enc, undefined);
  const description = tryDecrypt(caseData.description_enc, undefined);
  const category = tryDecrypt(caseData.category_enc, undefined);
  const urgency = tryDecrypt(caseData.urgency_enc, undefined);
  const jurisdiction = tryDecrypt(caseData.jurisdiction_enc, undefined);
  const opposingParty = tryDecrypt(caseData.opposingParty_enc, undefined);
  const claimValue = tryDecrypt(caseData.claimValue_enc, undefined);
  const hearingDates = tryDecrypt(caseData.hearingDates_enc, '[]');
  const exhibits = tryDecrypt(caseData.exhibits_enc, '[]');
  const clientDocuments = tryDecrypt(caseData.clientDocuments_enc, '[]');
  const caseUpdates = tryDecrypt(caseData.caseUpdates_enc, '[]');

  let parsedHearings: any[] = [];
  try {
    parsedHearings = JSON.parse(hearingDates || '[]');
  } catch {}

  const clientUserDoc = await User.findById(caseData.clientId.toString()).lean();
  const clientName = clientUserDoc?.fullName || caseData.clientId.toString();

  const lawyerUserDocs = await User.find({ _id: { $in: caseData.lawyerIds } }).lean();
  const lawyerNames = caseData.lawyerIds.map((id: any) => {
    const lawyer = lawyerUserDocs.find(u => u._id.toString() === id.toString());
    return lawyer?.fullName || id;
  });

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/cases"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-navy-core transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden>
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Cases
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">
              Case Detail
            </h1>
            <code className="text-sm text-text-muted">{caseData._id.toString()}</code>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
          <CaseTabs
            caseId={caseData._id.toString()}
            overview={
              <OverviewTab
                caseId={caseData._id.toString()}
                caseMongoId={caseData._id.toString()}
                status={caseData.status}
                clientId={caseData.clientId.toString()}
                clientName={clientName}
                lawyerIds={caseData.lawyerIds}
                lawyerNames={lawyerNames}
                createdAt={caseData.createdAt.toISOString()}
                updatedAt={caseData.updatedAt.toISOString()}
                title={title}
                description={description}
                category={category}
                urgency={urgency}
                jurisdiction={jurisdiction}
                opposingParty={opposingParty}
                claimValue={claimValue}
              />
            }
            personnel={<div className="p-10 text-center text-slate-500 italic">Personnel details are restricted to legal counsel.</div>}
            hearings={
              parsedHearings.length === 0 ? (
                <div className="p-10 text-center text-slate-500 italic">No hearings scheduled yet.</div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Scheduled Hearings</h3>
                  <ul className="space-y-3">
                    {parsedHearings.map((h: any, i: number) => (
                      <li key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1">
                        <p className="font-bold text-navy-core">
                          {h.date ? new Date(h.date).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) : 'Unscheduled'}
                        </p>
                        <p className="text-sm font-medium text-slate-700">{h.title || 'Untitled Hearing'}</p>
                        {h.notes && <p className="text-sm text-slate-500 mt-1">{h.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
            notes={undefined}
            exhibits={
              <ExhibitsTab
                caseId={caseData._id.toString()}
                casePrivateKeyHex={casePrivateKeyHex}
                casePublicKey={caseData.casePublicKey}
                initialData={exhibits || '[]'}
                readOnly={true}
              />
            }
            clientDocuments={
              <ClientDocumentsTab
                key="client-documents"
                caseId={caseData._id.toString().toString()}
                casePrivateKeyHex={casePrivateKeyHex}
                casePublicKey={caseData.casePublicKey}
                initialData={clientDocuments || '[]'}
                readOnly={false}
              />
            }
            messages={
              <MessagesTab
                caseId={caseData._id.toString()}
                casePrivateKeyHex={casePrivateKeyHex}
                casePublicKey={caseData.casePublicKey}
                currentUserId={userId}
              />
            }
          />
      </div>
    </div>
  );
}
