'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  // On load, verify the token and fetch invitation metadata
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
            You've been<br />invited to Counsel.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Set a password to activate your {role || 'account'}.<br />
            Your RSA keypair will be generated automatically.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Invitation verified via HMAC
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            RSA keypair generated on activation
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Password never stored in plaintext
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

          {fetching ? (
            <div className="text-center text-slate-500">Verifying invitation...</div>
          ) : invalid ? (
            <div className="space-y-6 text-center">
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
                This invitation link is invalid or has already been used.
              </div>
              <Link href="/">
                <Button variant="outline" className="mt-4">Back to Home</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Activate your account</h1>
                <p className="text-slate-500">
                  Invited as <strong className="text-slate-900">{role}</strong> · {email}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-600 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-slate-700">New Password</label>
                  <Input type="password" id="password" name="password" required placeholder="Create a strong password" disabled={loading} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="text-sm font-semibold text-slate-700">Confirm Password</label>
                  <Input type="password" id="confirm" name="confirm" required placeholder="Repeat your password" disabled={loading} />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                      Generating Keys & Activating...
                    </span>
                  ) : (
                    'Activate Account'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
