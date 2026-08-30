'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
            Start managing<br />cases securely.
          </h2>
          <p className="text-[0.95rem] text-white/50 leading-relaxed">
            Your account generates its own RSA keypair.<br />
            Personal data is encrypted before it is stored.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 z-10">
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            RSA keypair generated on registration
          </div>
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            Name, email & phone encrypted immediately
          </div>
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            Password never stored in plaintext
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className="bg-bg-card flex flex-col justify-center items-center py-16 px-8 md:px-18 overflow-y-auto">
        <div className="w-full max-w-[400px] animate-fade-up">
          <div className="mb-9">
            <h1 className="text-[1.7rem] font-extrabold text-text-primary tracking-tight mb-1.5">Create your account</h1>
            <p className="text-[0.9rem] text-text-muted">All fields are encrypted before being saved.</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

          <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5 mb-4">
              <label htmlFor="username" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="Sajid Mahir"
                disabled={loading}
                autoComplete="name"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>
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
              <label htmlFor="contact" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Phone Number</label>
              <input
                type="tel"
                id="contact"
                name="contact"
                required
                placeholder="+880 1711-234567"
                disabled={loading}
                autoComplete="tel"
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
                placeholder="Create a strong password"
                disabled={loading}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
              />
            </div>

            <button type="submit" className="mt-2 bg-navy-core text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-navy-deepest transition-colors disabled:opacity-70" disabled={loading}>
              {loading ? 'Generating RSA Keys & Registering…' : 'Create Secure Account'}
            </button>
          </form>

          <hr className="border-t border-border my-6" />

          <div className="text-center text-[0.88rem] text-text-muted">
            Already have an account?
            <Link href="/login" className="text-navy-core font-semibold ml-1 hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
