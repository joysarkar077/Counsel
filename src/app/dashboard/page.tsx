import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">Overview</h1>
        <p className="text-text-muted text-[0.95rem]">Welcome back. Here's what's happening with your cases.</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mb-10">
        <div className="bg-bg-card rounded-xl shadow-sm border border-border p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-page flex items-center justify-center text-navy-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider mb-1">Active Cases</p>
            <p className="text-[1.8rem] font-extrabold text-navy-deepest leading-none">0</p>
          </div>
        </div>
        
        <div className="bg-bg-card rounded-xl shadow-sm border border-border p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-page flex items-center justify-center text-gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider mb-1">Upcoming Hearings</p>
            <p className="text-[1.8rem] font-extrabold text-navy-deepest leading-none">0</p>
          </div>
        </div>
        
        <div className="bg-bg-card rounded-xl shadow-sm border border-border p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-page flex items-center justify-center text-navy-deepest">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider mb-1">Unread Messages</p>
            <p className="text-[1.8rem] font-extrabold text-navy-deepest leading-none">0</p>
          </div>
        </div>
      </div>

      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-[1.2rem] font-bold text-navy-deepest">Recent Cases</h2>
          <Link href="/dashboard/cases" className="text-[0.9rem] font-semibold text-navy-core hover:underline">View All</Link>
        </div>
        
        <div className="bg-bg-card rounded-xl shadow-sm border border-border py-12 px-6 flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 text-border mb-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <h3 className="text-[1.1rem] font-bold text-text-primary">No cases found</h3>
          <p className="text-text-muted text-[0.95rem] max-w-[400px]">You haven't submitted or been assigned to any cases yet.</p>
          <Link href="/dashboard/cases/new" className="mt-4 bg-navy-core text-white font-semibold py-2 px-4 rounded-lg hover:bg-navy-deepest transition-colors inline-block">
            Submit a Request
          </Link>
        </div>
      </div>
    </div>
  );
}
