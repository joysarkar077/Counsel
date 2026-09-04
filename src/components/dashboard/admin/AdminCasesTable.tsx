'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ILawyerCaseItem } from '@/types/lawyer-dashboard';

interface AdminCasesTableProps {
  cases: ILawyerCaseItem[];
}

export function AdminCasesTable({ cases }: AdminCasesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-subtle border border-slate-200/60 overflow-hidden">
      {/* Table Header/Toolbar */}
      <div className="p-4 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <h2 className="text-sm font-semibold text-slate-800">All Cases ({cases.length})</h2>
        <div className="relative w-full sm:w-72">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-core/20 focus:border-navy-core transition-all"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4 border-b border-slate-200/60">Case ID</th>
              <th className="px-6 py-4 border-b border-slate-200/60 w-1/3">Details</th>
              <th className="px-6 py-4 border-b border-slate-200/60">Status</th>
              <th className="px-6 py-4 border-b border-slate-200/60">Urgency</th>
              <th className="px-6 py-4 border-b border-slate-200/60 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/80">
            {filteredCases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-mono text-xs text-slate-500 font-medium">{c.caseId}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Created {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900 truncate max-w-[300px] group-hover:text-navy-core transition-colors">
                    {c.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex gap-2">
                    <span>{c.category}</span>
                    <span className="text-slate-300">•</span>
                    <span>{c.jurisdiction}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide
                    ${c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 
                      c.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200/60' : 
                      'bg-slate-100 text-slate-600 border border-slate-200/60'}`}
                  >
                    {c.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${c.urgency.toLowerCase() === 'high' ? 'bg-red-500' : c.urgency.toLowerCase() === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    {c.urgency}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/admin/dashboard/cases/${c.id}`}
                    className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-md transition-colors"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {filteredCases.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No cases found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Stack View */}
      <div className="sm:hidden divide-y divide-slate-100">
        {filteredCases.map((c) => (
          <div key={c.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="font-mono text-xs text-slate-500 mb-1">{c.caseId}</div>
                <div className="font-semibold text-slate-900 text-sm truncate leading-snug">{c.title}</div>
              </div>
              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide
                ${c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 
                  c.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700' : 
                  'bg-slate-100 text-slate-600'}`}
              >
                {c.status.replace('_', ' ')}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${c.urgency.toLowerCase() === 'high' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                {c.urgency}
              </div>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="truncate">{c.category}</span>
            </div>

            <Link 
              href={`/admin/dashboard/cases/${c.id}`}
              className="mt-2 w-full inline-flex items-center justify-center text-xs font-semibold px-3 py-2 bg-slate-100 text-slate-700 rounded-md active:bg-slate-200 transition-colors"
            >
              Review Case
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
