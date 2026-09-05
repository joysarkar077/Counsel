import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { CaseTabs } from '@/components/dashboard/cases/case-detail/case-tabs';
import { OverviewTab } from '@/components/dashboard/cases/case-detail/overview-tab';
import { HearingsTab } from '@/components/dashboard/cases/case-detail/hearings-tab';
import { NotesTab } from '@/components/dashboard/cases/case-detail/notes-tab';
import { ExhibitsTab } from '@/components/dashboard/cases/case-detail/exhibits-tab';
import { MessagesTab } from '@/components/dashboard/cases/case-detail/messages-tab';
import type { CaseStatus } from '@/types/case';
import dbConnect from '@/lib/db/mongoose';
import { User } from '@/models/User';
import { decrypt } from '@/lib/crypto/rsa';
import { decryptText, importAESKey } from '@/lib/crypto/textCrypto';

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

/** Fetch the case from the internal API, forwarding the session cookie. */
async function fetchCase(id: string, cookieHeader: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/cases/${id}`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch case: ${res.status}`);

  const json = await res.json();
  return json.data as {
    _id: string;
    clientId: string;
    title_enc: string;
    description_enc: string;
    category_enc: string;
    urgency_enc: string;
    jurisdiction_enc: string;
    opposingParty_enc: string;
    claimValue_enc: string;
    hearingDates_enc?: string;
    exhibits_enc?: string;
    caseUpdates_enc?: string;
    accessKeys: any[];
    lawyerIds: string[];
    status: CaseStatus;
    createdAt: string;
    updatedAt: string;
  };
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const caseData = await fetchCase(id, cookieHeader);
  if (!caseData) notFound();

  // Fetch the user's RSA keys for decryption
  await dbConnect();
  
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  
  if (!userId) {
    redirect('/login');
  }

  const user = await User.findById(userId).lean();
  let privateKey: any = null;
  if (user && user.publicKey && user.encryptedPrivateKey) {
    try {
      const publicKey = JSON.parse(user.publicKey);
      privateKey = { d: user.encryptedPrivateKey, n: publicKey.n };
    } catch (err) {
      console.error('Failed to parse client RSA keys:', err);
    }
  }

  // Derive the shared AES case key once, used for both field decryption and messaging
  let aesKeyHex = '';
  const myAccessKey = caseData.accessKeys?.find((ak: any) => ak.userId?.toString() === userId);
  if (myAccessKey && privateKey) {
    try {
      aesKeyHex = decrypt(myAccessKey.encryptedCaseKey, privateKey);
    } catch (err) {
      console.error('Failed to decrypt AES case key for client:', err);
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

  const title = await tryDecrypt(caseData.title_enc, undefined);
  const description = await tryDecrypt(caseData.description_enc, undefined);
  const category = await tryDecrypt(caseData.category_enc, undefined);
  const urgency = await tryDecrypt(caseData.urgency_enc, undefined);
  const jurisdiction = await tryDecrypt(caseData.jurisdiction_enc, undefined);
  const opposingParty = await tryDecrypt(caseData.opposingParty_enc, undefined);
  const claimValue = await tryDecrypt(caseData.claimValue_enc, undefined);
  const hearingDates = await tryDecrypt(caseData.hearingDates_enc, '[]');
  const exhibits = await tryDecrypt(caseData.exhibits_enc, '[]');
  const caseUpdates = await tryDecrypt(caseData.caseUpdates_enc, '[]');

  let parsedHearings: any[] = [];
  try {
    parsedHearings = JSON.parse(hearingDates || '[]');
  } catch (e) {}

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
            <code className="text-sm text-text-muted">{caseData._id}</code>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
          <CaseTabs
            caseId={caseData._id}
            overview={
              <OverviewTab
                caseId={caseData._id}
                status={caseData.status}
                clientId={caseData.clientId}
                lawyerIds={caseData.lawyerIds}
                createdAt={caseData.createdAt}
                updatedAt={caseData.updatedAt}
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
            notes={<NotesTab caseId={caseData._id} aesKeyHex={aesKeyHex} initialUpdates={caseUpdates || '[]'} readOnly={true} />}
            exhibits={<ExhibitsTab caseId={caseData._id} aesKeyHex={aesKeyHex} initialData={exhibits || '[]'} readOnly={true} />}
            messages={<MessagesTab caseId={caseData._id} aesKeyHex={aesKeyHex} currentUserId={userId} />}
          />
      </div>
    </div>
  );
}
