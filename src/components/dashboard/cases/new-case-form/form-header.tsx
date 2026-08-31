export function FormHeader() {
  return (
    <div className="flex flex-col gap-1.5 pb-4 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900">Case Details</h3>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          E2E Encrypted
        </span>
      </div>
      <p className="text-sm text-slate-500">
        All information submitted here is end-to-end encrypted. Only your assigned lawyer will be able to read it.
      </p>
    </div>
  );
}
