import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-[1.8rem] font-extrabold text-navy-deepest tracking-tight mb-1">System Administration</h1>
          <p className="text-[0.95rem] text-text-muted">Supervise users, assign cases, and monitor system health.</p>
        </div>
        <div>
          <button className="flex items-center gap-2 py-2.5 px-5 text-[0.9rem] bg-navy-core text-white rounded-lg font-semibold hover:bg-navy-deepest transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Invite Lawyer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5 mb-10">
        <div className="bg-bg-card border border-border shadow-sm rounded-xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-page flex items-center justify-center text-navy-core">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-[1.8rem] font-extrabold text-navy-deepest leading-none">12</p>
          </div>
        </div>
        
        <div className="bg-bg-card border border-border shadow-sm rounded-xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-page flex items-center justify-center text-gold-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider mb-1">Total Cases</p>
            <p className="text-[1.8rem] font-extrabold text-navy-deepest leading-none">4</p>
          </div>
        </div>
        
        <div className="bg-bg-card border border-border shadow-sm rounded-xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-bg-page flex items-center justify-center text-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <p className="text-[0.85rem] font-semibold text-text-muted uppercase tracking-wider mb-1">System Health</p>
            <p className="text-[1.8rem] font-extrabold text-navy-deepest leading-none">100%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
        <div>
          <div className="mb-4">
            <h2 className="text-[1.2rem] font-bold text-navy-deepest">Pending Cases (Needs Assignment)</h2>
          </div>
          
          <div className="bg-bg-card border border-border shadow-sm rounded-xl flex flex-col">
            <div className="flex justify-between items-center p-6 flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[0.8rem] font-bold text-navy-core bg-navy-core/10 py-0.5 px-2 rounded w-fit">CASE-004</span>
                <span className="text-[1.05rem] font-semibold text-text-primary">Breach of Contract Dispute</span>
                <span className="text-[0.85rem] text-text-secondary">Submitted 2 hours ago</span>
              </div>
              <button className="bg-bg-page text-navy-core border border-border py-2 px-4 text-[0.85rem] rounded hover:bg-navy-core hover:text-white hover:border-navy-core transition-colors font-semibold">Assign Lawyer</button>
            </div>
            
            <div className="h-px bg-border"></div>
            
            <div className="flex justify-between items-center p-6 flex-wrap gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[0.8rem] font-bold text-navy-core bg-navy-core/10 py-0.5 px-2 rounded w-fit">CASE-005</span>
                <span className="text-[1.05rem] font-semibold text-text-primary">Intellectual Property Review</span>
                <span className="text-[0.85rem] text-text-secondary">Submitted 5 hours ago</span>
              </div>
              <button className="bg-bg-page text-navy-core border border-border py-2 px-4 text-[0.85rem] rounded hover:bg-navy-core hover:text-white hover:border-navy-core transition-colors font-semibold">Assign Lawyer</button>
            </div>
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <h2 className="text-[1.2rem] font-bold text-navy-deepest">Recent Activity</h2>
          </div>
          <div className="bg-bg-card border border-border shadow-sm rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-start gap-3 text-[0.9rem] text-text-secondary leading-snug">
              <div className="w-2 h-2 rounded-full bg-navy-core mt-1.5 shrink-0"></div>
              <p>Lawyer <strong className="text-text-primary font-semibold">Adv. Anisul Huq</strong> updated CASE-002</p>
            </div>
            <div className="flex items-start gap-3 text-[0.9rem] text-text-secondary leading-snug">
              <div className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0"></div>
              <p>New case requested by client</p>
            </div>
            <div className="flex items-start gap-3 text-[0.9rem] text-text-secondary leading-snug">
              <div className="w-2 h-2 rounded-full bg-success mt-1.5 shrink-0"></div>
              <p>System Initialized</p>
            </div>
            
            <Link href="/dashboard/audit" className="mt-2 text-[0.9rem] font-semibold text-navy-core hover:underline">
              View Full Audit Log &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
