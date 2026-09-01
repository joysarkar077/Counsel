'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

      if (result.requires2FA) {
        router.push('/verify-2fa');
      } else if (result.role === 'admin' || result.role === 'super_admin') {
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left: Branding Panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-slate-900 text-white flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-navy-core flex items-center justify-center text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <span className="font-bold tracking-tight text-lg">Counsel</span>
        </Link>

        <div className="space-y-6">
          <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1]">
            Secure legal<br />case management.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Every record encrypted. Every action audited. Access requires verification.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            RSA-encrypted personal data
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            TOTP two-factor authentication
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Hash-chained audit log
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-up">
          {/* Mobile brand fallback */}
          <Link href="/" className="md:hidden flex items-center gap-3 mb-8 text-slate-900">
            <div className="w-8 h-8 rounded-lg bg-navy-core flex items-center justify-center text-white shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <span className="font-bold tracking-tight text-lg">Counsel</span>
          </Link>

          <div className="space-y-2 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-slate-500">Sign in to your Counsel account.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
              <Input
                type="email"
                id="email"
                name="email"
                required
                placeholder="name@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              <Input
                type="password"
                id="password"
                name="password"
                required
                placeholder="••••••••"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="relative py-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Don't have an account?</span>
            </div>
          </div>

          <div className="text-center">
            <Link href="/register" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
