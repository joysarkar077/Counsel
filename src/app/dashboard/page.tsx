import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="animate-fade-up space-y-8 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Welcome back. Summary of your legal cases and activities.</p>
        </div>
        <Link
          href="/dashboard/cases/new"
          className="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Case Request
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-subtle flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Cases</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-slate-900">1</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">1 total</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-subtle flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming Hearings</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-slate-900">0</span>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">None scheduled</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/60 shadow-subtle flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unread Messages</span>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-slate-900">0</span>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">All caught up</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Cases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/60 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Cases</h2>
            <Link href="/dashboard/cases" className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/cases/case-1"
              className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Divorce Settlement - Smith
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Updated Aug 25, 2026</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Active
              </span>
            </Link>

            <Link
              href="/dashboard/cases/case-2"
              className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all group"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Property Dispute - Johnson
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Updated Aug 28, 2026</p>
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                Pending Review
              </span>
            </Link>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-subtle p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-4">Quick Navigation</h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/cases/new"
                className="flex items-center justify-between p-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span>Submit Case Request</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/dashboard/audit"
                className="flex items-center justify-between p-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span>Audit Logs</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center justify-between p-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <span>Settings</span>
                <span className="text-slate-400">→</span>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>End-to-End Encrypted Workspace</span>
          </div>
        </div>
      </div>
    </div>
  );
}
