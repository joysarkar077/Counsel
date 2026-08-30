'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const isAuthPage = 
    pathname === '/login' || 
    pathname === '/register' || 
    pathname === '/verify-2fa' || 
    pathname.startsWith('/dashboard');

  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-8 h-[68px] flex items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-2.5 text-[1.2rem] font-extrabold text-navy-deepest hover:text-navy-core tracking-tight">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-6 h-6 text-gold">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Counsel
        </Link>

        <div className="flex items-center gap-2 flex-1 justify-center">
          <Link href="#features" className="text-text-secondary text-sm font-medium px-3.5 py-1.5 rounded-md transition-colors hover:text-navy-core hover:bg-navy-core/5">Features</Link>
          <Link href="#security" className="text-text-secondary text-sm font-medium px-3.5 py-1.5 rounded-md transition-colors hover:text-navy-core hover:bg-navy-core/5">Security</Link>
          <Link href="#about" className="text-text-secondary text-sm font-medium px-3.5 py-1.5 rounded-md transition-colors hover:text-navy-core hover:bg-navy-core/5">About</Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/login" className="px-4 py-2 text-sm border border-border text-navy-core font-semibold rounded-lg hover:bg-navy-core hover:text-white transition-colors">Sign In</Link>
          <Link href="/register" className="px-4 py-2 text-sm bg-navy-core text-white font-semibold rounded-lg hover:bg-navy-deepest transition-colors">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}
