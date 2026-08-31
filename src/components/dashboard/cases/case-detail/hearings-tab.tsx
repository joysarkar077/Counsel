/** Hearings tab — placeholder until the Hearing model and API are implemented. */
export function HearingsTab({ caseId }: { caseId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-dashed border-border bg-bg-page">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="mb-4 h-10 w-10 text-text-muted"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p className="text-sm font-semibold text-text-secondary">No hearings scheduled</p>
      <p className="mt-1 text-xs text-text-muted max-w-xs">
        Hearings for case <code className="text-navy-core">{caseId}</code> will appear here once
        a lawyer schedules them. The hearing records are ECC-encrypted at rest.
      </p>
    </div>
  );
}
