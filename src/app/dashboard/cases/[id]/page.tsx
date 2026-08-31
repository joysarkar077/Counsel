import { notFound } from 'next/navigation';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { CaseTabs } from '@/components/dashboard/cases/case-detail/case-tabs';
import { OverviewTab } from '@/components/dashboard/cases/case-detail/overview-tab';
import { HearingsTab } from '@/components/dashboard/cases/case-detail/hearings-tab';
import { NotesTab } from '@/components/dashboard/cases/case-detail/notes-tab';
import { MessagesTab } from '@/components/dashboard/cases/case-detail/messages-tab';
import type { CaseStatus } from '@/types/case';

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

  // TODO(Task 6 — Session Management): decrypt title_enc and description_enc here
  // using the user's ECC private key once ECDSA session tokens are in place.
  // For now the Overview tab renders the encrypted-placeholder state.

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
        <CaseTabs>
          {(activeTab) => {
            switch (activeTab) {
              case 'overview':
                return (
                  <OverviewTab
                    caseId={caseData._id}
                    status={caseData.status}
                    clientId={caseData.clientId}
                    lawyerIds={caseData.lawyerIds}
                    createdAt={caseData.createdAt}
                    updatedAt={caseData.updatedAt}
                    // title and description left undefined until Task 6 decryption is wired
                  />
                );
              case 'hearings':
                return <HearingsTab caseId={caseData._id} />;
              case 'notes':
                return <NotesTab caseId={caseData._id} />;
              case 'messages':
                return <MessagesTab caseId={caseData._id} />;
            }
          }}
        </CaseTabs>
      </div>
    </div>
  );
}
