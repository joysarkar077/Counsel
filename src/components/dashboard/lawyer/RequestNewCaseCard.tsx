import Link from 'next/link';
import type { ILawyerCaseItem } from '@/types/lawyer-dashboard';

export interface RequestNewCaseCardProps {
  readonly recentAssignments: readonly ILawyerCaseItem[];
}

export function RequestNewCaseCard({ recentAssignments }: RequestNewCaseCardProps): React.ReactNode {
  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-sm p-5 space-y-4">
      {/* Top Banner for Requesting New Case */}
      <div className="p-4 rounded-lg bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold tracking-tight">Need to open a new case?</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Submit a new case file request. Once submitted, case details will be indexed and assigned.
          </p>
        </div>
        <Link
          href="/client/dashboard/cases/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors shrink-0 shadow-sm"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Request New Case File
        </Link>
      </div>

      {/* Admin Assigned Cases Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Recent Admin Assignments
          </h3>
          <span className="text-[11px] font-semibold text-slate-500">
            {recentAssignments.length} total
          </span>
        </div>

        {recentAssignments.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs rounded-lg border border-dashed border-slate-200 bg-slate-50/40">
            No recent case assignments from administrators.
          </div>
        ) : (
          <div className="space-y-2">
            {recentAssignments.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 transition-all"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{item.caseId}</span>
                  <p className="text-xs font-semibold text-slate-900">{item.title}</p>
                </div>
                <Link
                  href={`/client/dashboard/cases/${item.id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  View Case →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
