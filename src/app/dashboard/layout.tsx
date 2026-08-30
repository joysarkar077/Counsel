'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-68px)] bg-bg-page">
      <aside className="w-[260px] bg-bg-card border-r border-border flex flex-col py-6 px-4 shrink-0">
        <div className="px-3 pb-4 mb-2">
          <span className="text-[0.85rem] font-bold uppercase tracking-wider text-text-muted">Menu</span>
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          <Link href="/dashboard" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.95rem] font-semibold text-text-secondary transition-colors hover:bg-navy-core/5 hover:text-navy-core group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            Overview
          </Link>
          <Link href="/dashboard/cases" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.95rem] font-semibold text-text-secondary transition-colors hover:bg-navy-core/5 hover:text-navy-core group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Cases
          </Link>
          <Link href="/dashboard/messages" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.95rem] font-semibold text-text-secondary transition-colors hover:bg-navy-core/5 hover:text-navy-core group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Messages
          </Link>
          <div className="h-px bg-border mx-3 my-4"></div>
          <Link href="/dashboard/audit" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.95rem] font-semibold text-text-secondary transition-colors hover:bg-navy-core/5 hover:text-navy-core group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Audit Log
          </Link>
          <Link href="/dashboard/profile" className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.95rem] font-semibold text-text-secondary transition-colors hover:bg-navy-core/5 hover:text-navy-core group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Profile
          </Link>
          
          <div className="flex-1 min-h-[32px]"></div>
          
          <button onClick={handleLogout} className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-[0.95rem] font-semibold text-text-muted mt-auto hover:bg-red-500/10 hover:text-red-600 transition-colors group">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
