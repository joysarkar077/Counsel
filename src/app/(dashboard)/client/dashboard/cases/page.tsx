import Link from 'next/link';
import { CasesList } from '@/components/dashboard/cases/cases-list';

const mockCases = [
  {
    id: 'case-1',
    title: 'Divorce Settlement - Smith',
    status: 'ACTIVE' as const,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-25T14:30:00Z',
  },
  {
    id: 'case-2',
    title: 'Property Dispute - Johnson',
    status: 'PENDING_REVIEW' as const,
    createdAt: '2026-08-28T09:15:00Z',
    updatedAt: '2026-08-28T09:15:00Z',
  },
  {
    id: 'case-3',
    title: 'Custody Agreement - Davis',
    status: 'CLOSED' as const,
    createdAt: '2026-05-12T11:20:00Z',
    updatedAt: '2026-07-30T16:45:00Z',
  },
];

export default function CasesPage() {
  return (
    <div className="animate-fade-up space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cases</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage and view your encrypted legal cases.</p>
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

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/60 shadow-subtle p-6">
        <CasesList cases={mockCases} />
      </div>
    </div>
  );
}
