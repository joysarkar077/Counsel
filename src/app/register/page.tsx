'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      username: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      contact: data.phone,
      password: data.password,
      role: data.role,
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      router.push('/login?registered=true');
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
            Start your secure<br />case today.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Join the zero-trust platform designed for legal professionals and their clients.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            End-to-End Encryption
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Role-Based Access Controls
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Tamper-Evident Architecture
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-up py-8">
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h1>
            <p className="text-slate-500">Enter your details to get started with Counsel.</p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700">Account Type</label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="role" value="client" defaultChecked className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" disabled={loading} />
                  <span className="text-sm font-medium text-slate-900">Client</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                  <input type="radio" name="role" value="lawyer" className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500" disabled={loading} />
                  <span className="text-sm font-medium text-slate-900">Lawyer</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="text-sm font-semibold text-slate-700">First Name</label>
                <Input type="text" id="firstName" name="firstName" required disabled={loading} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="text-sm font-semibold text-slate-700">Last Name</label>
                <Input type="text" id="lastName" name="lastName" required disabled={loading} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
              <Input type="email" id="email" name="email" required placeholder="name@example.com" disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-sm font-semibold text-slate-700">Phone Number</label>
              <Input type="tel" id="phone" name="phone" required placeholder="+880 1..." disabled={loading} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-semibold text-slate-700">Password</label>
              <Input type="password" id="password" name="password" required disabled={loading} />
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-emerald-600">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Privacy Notice
              </div>
              <p>Your name, email, and phone number will be encrypted with RSA upon registration. Counsel staff cannot read your PII without authorized key access.</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                  Creating Account...
                </span>
              ) : (
                'Register Securely'
              )}
            </Button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Already have an account?</span>
            </div>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
