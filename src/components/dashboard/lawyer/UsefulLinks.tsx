import Link from 'next/link';

export function UsefulLinks(): React.ReactNode {
  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm p-5 space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-900 tracking-tight mb-3">
          Quick Links & Navigation
        </h2>
        <div className="space-y-1">
          <Link
            href="/client/dashboard/cases"
            className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              View All Assigned Cases
            </span>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          <Link
            href="/client/dashboard/messages"
            className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Client Messages
            </span>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          <Link
            href="/lawyer/dashboard/profile"
            className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Attorney Profile
            </span>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>

          <Link
            href="/client/dashboard/audit"
            className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
          >
            <span className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Audit Log
            </span>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
