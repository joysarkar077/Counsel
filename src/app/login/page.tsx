'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to sign in');
      }

      const result = await res.json();

      if (result.role === 'admin' || result.role === 'super_admin') {
        router.push('/dashboard/admin');
      } else if (result.role === 'lawyer') {
        router.push('/dashboard/lawyer');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left: Branding panel */}
      <div className="bg-navy-deepest flex flex-col justify-between py-12 px-14 relative overflow-hidden hidden md:flex">
        <div className="absolute w-[400px] h-[400px] bg-gold/10 rounded-full -top-[100px] -right-[100px] pointer-events-none"></div>
        <div className="absolute w-[300px] h-[300px] bg-navy-light/20 rounded-full -bottom-[80px] -left-[60px] pointer-events-none"></div>
        
        <Link href="/" className="flex items-center gap-2.5 z-10">
          <span className="text-gold text-[1.15rem] font-extrabold flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-[22px] h-[22px] text-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Counsel
          </span>
        </Link>

        <div className="flex flex-col gap-4 z-10">
          <h2 className="text-[2rem] font-extrabold text-white leading-[1.2] tracking-tight">
            Secure legal<br />case management.
          </h2>
          <p className="text-[0.95rem] text-white/50 leading-relaxed">
            Every record encrypted. Every action audited.<br />
            Access requires two-factor verification.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 z-10">
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            RSA-encrypted personal data
          </div>
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            TOTP two-factor authentication
          </div>
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            Hash-chained tamper-evident audit log
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="bg-bg-card flex flex-col justify-center items-center py-16 px-8 md:px-18 overflow-y-auto">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="mb-9">
            <h1 className="text-[1.7rem] font-extrabold text-text-primary tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-[0.9rem] text-text-muted">Sign in to your Counsel account.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

          <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="email" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="sajid.mahir@example.com"
                disabled={loading}
                autoComplete="email"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="password" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>

            <button type="submit" className="mt-2 bg-navy-core text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-navy-deepest transition-colors disabled:opacity-70" disabled={loading}>
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <hr className="border-t border-border my-6" />

          <div className="text-center text-[0.88rem] text-text-muted">
            Don't have an account?
            <Link href="/register" className="text-navy-core font-semibold ml-1 hover:underline">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
