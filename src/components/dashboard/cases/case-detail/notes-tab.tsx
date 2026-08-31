/** Notes & Files tab — placeholder until the CaseNote and CaseFile models are implemented. */
export function NotesTab({ caseId }: { caseId: string }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Notes section */}
      <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border bg-bg-page">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-4 h-10 w-10 text-text-muted"
          aria-hidden
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        <p className="text-sm font-semibold text-text-secondary">No notes yet</p>
        <p className="mt-1 text-xs text-text-muted max-w-xs">
          Lawyer notes for case <code className="text-navy-core">{caseId}</code> will appear here.
          All note content is ECC-encrypted via ECIES before storage.
        </p>
      </div>

      {/* File uploads section */}
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          Attached Files
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border border-dashed border-border bg-bg-page">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mb-3 h-8 w-8 text-text-muted"
            aria-hidden
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-xs text-text-muted max-w-xs">
            File upload UI will be implemented as part of the File Upload Component task. Files are
            chunked client-side before encryption and stored in GridFS.
          </p>
        </div>
      </div>
    </div>
  );
}
