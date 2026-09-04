'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type CaseStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'CLOSE_REQUESTED' | 'CLOSED';

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CasesListProps {
  readonly cases: readonly Case[];
}

function getStatusBadge(status: CaseStatus) {
  const base = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold';
  switch (status) {
    case 'ACTIVE':
      return <span className={`${base} bg-emerald-50 text-emerald-700`}>Active</span>;
    case 'PENDING_REVIEW':
      return <span className={`${base} bg-amber-50 text-amber-700`}>Pending Review</span>;
    case 'REJECTED':
      return <span className={`${base} bg-rose-50 text-rose-700`}>Rejected</span>;
    case 'CLOSE_REQUESTED':
      return <span className={`${base} bg-orange-50 text-orange-700`}>Close Requested</span>;
    case 'CLOSED':
      return <span className={`${base} bg-slate-100 text-slate-600`}>Closed</span>;
    default:
      return <span className={`${base} bg-slate-100 text-slate-600`}>{status}</span>;
  }
}

export function CasesList({ cases }: CasesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, searchQuery, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200/80 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-slate-400 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-slate-400 focus:outline-none transition-all"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="CLOSE_REQUESTED">Close Requested</option>
            <option value="CLOSED">Closed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredCases.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs rounded-lg border border-dashed border-slate-200">
          No cases found matching your filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/60 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-2">Title</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Updated</th>
                <th className="py-3 px-2">Created</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3.5 px-2 font-semibold text-slate-900">
                    <Link href={`/client/dashboard/cases/${c.id}`} className="hover:text-blue-600 transition-colors">
                      {c.title}
                    </Link>
                  </td>
                  <td className="py-3.5 px-2">{getStatusBadge(c.status)}</td>
                  <td className="py-3.5 px-2 text-slate-500" suppressHydrationWarning>{new Date(c.updatedAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-2 text-slate-500" suppressHydrationWarning>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-2 text-right">
                    <Link
                      href={`/client/dashboard/cases/${c.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                    >
                      View
                      <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
