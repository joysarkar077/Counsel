'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { ILawyerCaseItem } from '@/types/lawyer-dashboard';

export interface CasesDirectoryProps {
  readonly cases: readonly ILawyerCaseItem[];
  readonly currentUserId: string;
}

export function CasesDirectory({ cases, currentUserId }: CasesDirectoryProps): React.ReactNode {
  const [activeTab, setActiveTab] = useState<'ALL' | 'ASSIGNED' | 'REQUESTS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // 1. Tab filter
      if (activeTab === 'ASSIGNED' && c.clientId === currentUserId) return false;
      if (activeTab === 'REQUESTS' && c.clientId !== currentUserId) return false;

      // 2. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!c.title.toLowerCase().includes(query) && !c.caseId.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [cases, activeTab, searchQuery, currentUserId]);

  const getStatusBadge = (status: string) => {
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
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency.toLowerCase().includes('urgent') || urgency.toLowerCase().includes('immediate')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200/60">{urgency}</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">{urgency}</span>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 border-b sm:border-b-0 border-slate-100 pb-2 sm:pb-0 text-sm font-medium text-slate-500 overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'ALL' ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              All Cases
            </button>
            <button
              onClick={() => setActiveTab('ASSIGNED')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'ASSIGNED' ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Assigned to Me
            </button>
            <button
              onClick={() => setActiveTab('REQUESTS')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === 'REQUESTS' ? 'bg-slate-900 text-white font-semibold' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              My Requests
            </button>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Case ID</th>
              <th className="px-5 py-3">Title & Category</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Urgency</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-12 h-12 text-slate-300">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                    </svg>
                    <p>No cases found matching your criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold text-slate-600 text-xs">{c.caseId}</span>
                  </td>
                  <td className="px-5 py-4 min-w-[250px]">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 truncate max-w-[300px]">{c.title}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{c.category} • {c.jurisdiction}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {getStatusBadge(c.status)}
                  </td>
                  <td className="px-5 py-4">
                    {getUrgencyBadge(c.urgency)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/lawyer/dashboard/cases/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
