import type { CaseStatus } from '@/types/case';

interface OverviewTabProps {
  caseId: string;
  status: CaseStatus;
  clientId: string;
  lawyerIds: string[];
  createdAt: string;
  updatedAt: string;
  
  /**
   * Decrypted title. Will be populated once ECDSA session management
   * provides the private key (Task 6). Shows a placeholder until then.
   */
  title?: string;
  /**
   * Decrypted description. Same caveat as title.
   */
  description?: string;
  /**
   * Decrypted opposing party. Same caveat.
   */
  opposingParty?: string;
  /**
   * Decrypted claim value. Same caveat.
   */
  claimValue?: string;
  /**
   * Decrypted category. Same caveat.
   */
  category?: string;
  /**
   * Decrypted urgency. Same caveat.
   */
  urgency?: string;
  /**
   * Decrypted jurisdiction. Same caveat.
   */
  jurisdiction?: string;
}

const STATUS_STYLES: Record<CaseStatus, { label: string; classes: string }> = {
  PENDING_REVIEW: {
    label: 'Pending Review',
    classes: 'bg-amber-100 text-amber-800',
  },
  ACTIVE: {
    label: 'Active',
    classes: 'bg-emerald-100 text-emerald-800',
  },
  CLOSE_REQUESTED: {
    label: 'Close Requested',
    classes: 'bg-rose-100 text-rose-800',
  },
  CLOSED: {
    label: 'Closed',
    classes: 'bg-slate-100 text-slate-800',
  },
  REJECTED: {
    label: 'Rejected',
    classes: 'bg-slate-100 text-slate-800',
  },
};

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-3 border-b border-slate-100 last:border-b-0">
      <span className="w-48 shrink-0 text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-sm text-slate-900">{value}</span>
    </div>
  );
}

function EncryptedPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-32 rounded bg-slate-200 animate-pulse"></div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
        Encrypted {label}
      </span>
    </div>
  );
}

export function OverviewTab({
  caseId,
  status,
  clientId,
  lawyerIds,
  createdAt,
  updatedAt,
  category,
  urgency,
  jurisdiction,
  title,
  description,
  opposingParty,
  claimValue,
}: OverviewTabProps) {
  const { label, classes } = STATUS_STYLES[status] || STATUS_STYLES.PENDING_REVIEW;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Routing & Meta grid */}
      <div className="rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
        <MetaRow label="Case ID" value={<code className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{caseId}</code>} />
        <MetaRow
          label="Status"
          value={
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${classes}`}>
              {label}
            </span>
          }
        />
        
        <MetaRow label="Client ID" value={clientId} />
        <MetaRow
          label="Assigned Lawyers"
          value={
            lawyerIds.length > 0 ? (
              <span>{lawyerIds.join(', ')}</span>
            ) : (
              <span className="italic text-slate-400">Not yet assigned</span>
            )
          }
        />
        <MetaRow label="Submitted" value={new Date(createdAt).toLocaleString()} />
        <MetaRow label="Last Updated" value={new Date(updatedAt).toLocaleString()} />
      </div>

      {/* Sensitive Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Case Details
          </h2>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
            {title ? <p className="text-sm text-slate-900 font-medium">{title}</p> : <EncryptedPlaceholder label="Title" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Practice Area</label>
              {category ? <p className="text-sm text-slate-900">{category}</p> : <EncryptedPlaceholder label="Category" />}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgency</label>
              {urgency ? <p className="text-sm text-slate-900">{urgency}</p> : <EncryptedPlaceholder label="Urgency" />}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jurisdiction</label>
              {jurisdiction ? <p className="text-sm text-slate-900">{jurisdiction}</p> : <EncryptedPlaceholder label="Jurisdiction" />}
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opposing Party</label>
              {opposingParty ? <p className="text-sm text-slate-900">{opposingParty}</p> : <EncryptedPlaceholder label="Party" />}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Claim Value</label>
              {claimValue ? <p className="text-sm text-slate-900">{claimValue}</p> : <EncryptedPlaceholder label="Value" />}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
            {description ? (
              <p className="text-sm text-slate-900 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-lg border border-slate-100">
                {description}
              </p>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  Decryption failed or is pending sync. You do not have the required key to read this description.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
