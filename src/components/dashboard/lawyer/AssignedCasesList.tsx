'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ILawyerCaseItem } from '@/types/lawyer-dashboard';
import type { CaseStatus } from '@/types/case';

export interface AssignedCasesListProps {
  readonly cases: readonly ILawyerCaseItem[];
}

function getStatusBadge(status: CaseStatus): React.ReactNode {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  switch (status) {
    case 'ACTIVE':
      return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-200/60`}>Active</span>;
    case 'PENDING_REVIEW':
      return <span className={`${base} bg-amber-50 text-amber-700 border border-amber-200/60`}>Pending Review</span>;
    case 'CLOSE_REQUESTED':
      return <span className={`${base} bg-orange-50 text-orange-700 border border-orange-200/60`}>Close Requested</span>;
    case 'CLOSED':
      return <span className={`${base} bg-slate-100 text-slate-600 border border-slate-200`}>Closed</span>;
    case 'REJECTED':
      return <span className={`${base} bg-rose-50 text-rose-700 border border-rose-200/60`}>Rejected</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-600`}>{status}</span>;
  }
}

export function AssignedCasesList({ cases }: AssignedCasesListProps): React.ReactNode {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/70 shadow-sm p-5 space-y-4">
      {/* Top Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Assigned Cases</span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {cases.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Active and managed client legal cases</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search assigned cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-all w-48 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-slate-400 focus:outline-none transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CLOSE_REQUESTED">Close Requested</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Cases List Content */}
      {filteredCases.length === 0 ? (
        <div className="py-10 text-center rounded-lg border border-dashed border-slate-200 bg-slate-50/30 p-6">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-xs font-semibold text-slate-700 mb-1">No assigned cases found</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or filters.'
              : 'You do not have any assigned cases at the moment. Review new case requests below to claim pending client requests.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredCases.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/60 transition-all group gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {c.caseId}
                  </span>
                  {getStatusBadge(c.status)}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                  {c.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span>Category: <strong className="font-medium text-slate-700">{c.category}</strong></span>
                  <span>•</span>
                  <span>Jurisdiction: <strong className="font-medium text-slate-700">{c.jurisdiction}</strong></span>
                  <span>•</span>
                  <span>Updated: {new Date(c.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Link
                  href={`/lawyer/dashboard/cases/${c.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  Open Case
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
