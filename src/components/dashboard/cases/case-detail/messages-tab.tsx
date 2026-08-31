/**
 * Messages tab — placeholder shell for the encrypted chat interface.
 *
 * The full implementation is Task 8 (Messages UI Integration):
 * - Poll-based or WebSocket chat
 * - ECIES-encrypted message bodies
 * - RSA-signed messages for non-repudiation
 * - Lawyer thread switching for multi-client cases
 */
export function MessagesTab({ caseId }: { caseId: string }) {
  return (
    <div className="flex flex-col h-[420px] rounded-xl border border-border bg-bg-card overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 text-navy-core"
            aria-hidden
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-xs font-semibold text-navy-core">End-to-end encrypted</span>
        </div>
        <code className="text-xs text-text-muted">{caseId}</code>
      </div>

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-4 h-10 w-10 text-text-muted"
          aria-hidden
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p className="text-sm font-semibold text-text-secondary">No messages yet</p>
        <p className="mt-1 text-xs text-text-muted max-w-xs">
          Secure messaging between you and your lawyer will be available here. Messages are
          ECIES-encrypted and RSA-signed for non-repudiation.
        </p>
      </div>

      {/* Disabled input bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-border bg-bg-page">
        <input
          type="text"
          disabled
          placeholder="Messaging coming in Task 8…"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-muted placeholder:text-text-muted disabled:cursor-not-allowed opacity-60"
        />
        <button
          disabled
          className="rounded-lg bg-navy-core px-4 py-2 text-sm font-semibold text-white opacity-40 cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
