'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function InviteAcceptPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/invitations/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setInvalid(true);
        } else {
          const data = await res.json();
          setEmail(data.email);
          setRole(data.role);
        }
      })
      .catch(() => setInvalid(true))
      .finally(() => setFetching(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirm = formData.get('confirm') as string;

    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/invitations/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create account');
      }

      router.push('/login?invited=true');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* Left branding panel */}
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
            You've been<br />invited to Counsel.
          </h2>
          <p className="text-[0.95rem] text-white/50 leading-relaxed">
            Set a password to activate your {role} account.<br />
            Your RSA keypair will be generated automatically.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 z-10">
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            Invitation verified via HMAC
          </div>
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            RSA keypair generated on activation
          </div>
          <div className="flex items-center gap-2.5 text-[0.85rem] text-white/55">
            <span className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            Password never stored in plaintext
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="bg-bg-card flex flex-col justify-center items-center py-16 px-8 md:px-18 overflow-y-auto">
        <div className="w-full max-w-[400px] animate-fade-up">
          {fetching ? (
            <p className="text-text-muted text-center">Verifying invitation…</p>
          ) : invalid ? (
            <div>
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">This invitation link is invalid or has already been used.</div>
              <Link href="/" className="mt-4 px-4 py-2 border border-border text-navy-core font-semibold rounded-lg hover:bg-navy-core hover:text-white transition-colors block text-center">Back to Home</Link>
            </div>
          ) : (
            <>
              <div className="mb-9">
                <h1 className="text-[1.7rem] font-extrabold text-text-primary tracking-tight mb-1.5">Activate your account</h1>
                <p className="text-[0.9rem] text-text-muted">
                  Invited as <strong className="font-semibold text-text-primary">{role}</strong> · {email}
                </p>
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">{error}</div>}

              <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-1.5 mb-4">
                  <label htmlFor="password" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">New Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="Create a strong password"
                    disabled={loading}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5 mb-4">
                  <label htmlFor="confirm" className="text-[0.85rem] font-bold text-text-secondary uppercase tracking-wider">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm"
                    name="confirm"
                    required
                    placeholder="Repeat your password"
                    disabled={loading}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-bg-page focus:border-navy-core focus:ring-1 focus:ring-navy-core outline-none transition-all disabled:opacity-50 text-text-primary"
                  />
                </div>

                <button type="submit" className="mt-2 bg-navy-core text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-navy-deepest transition-colors disabled:opacity-70" disabled={loading}>
                  {loading ? 'Generating Keys & Activating…' : 'Activate Account'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
