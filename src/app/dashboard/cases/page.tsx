import Link from 'next/link';
import { CasesList } from '@/components/dashboard/cases/cases-list';

// Mock data (since backend is not wired yet)
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
    <div className="animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">Cases</h1>
          <p className="text-text-muted text-[0.95rem]">Manage and view all your legal cases.</p>
        </div>
        <Link 
          href="/dashboard/cases/new" 
          className="inline-flex items-center justify-center gap-2 bg-navy-core hover:bg-navy-light text-white font-semibold py-3 px-6 rounded-lg transition-colors w-auto"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Case Request
        </Link>
      </div>

      <div className="bg-bg-card border border-border rounded-xl p-8">
        <CasesList cases={mockCases} />
      </div>
    </div>
  );
}
