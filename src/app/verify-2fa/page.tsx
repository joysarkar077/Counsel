'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = code.join('');
    if (otp.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Invalid code');
      }

      if (result.role === 'admin' || result.role === 'super_admin') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] flex justify-center items-center p-6 bg-bg-page">
      <div className="bg-bg-card border border-border shadow-sm rounded-xl animate-fade-up max-w-[440px] w-full py-12 px-10 flex flex-col items-center">
        <div className="bg-navy-core/10 rounded-full p-4.5 mb-6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-navy-core p-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className="text-[1.5rem] font-extrabold text-text-primary tracking-tight mb-2 text-center">Two-Factor Verification</h1>
        <p className="text-[0.9rem] text-text-muted text-center leading-relaxed mb-7">
          We've sent a 6-digit code to your email address.
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100 w-full">{error}</div>}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
          <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className="w-[52px] h-[60px] border-[1.5px] border-border rounded-lg text-center text-[1.5rem] font-bold text-navy-deepest bg-bg-card outline-none transition-all focus:border-navy-core focus:ring-[3px] focus:ring-navy-core/10 disabled:opacity-60"
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                disabled={loading}
                autoFocus={i === 0}
                id={`otp-${i}`}
              />
            ))}
          </div>

          <button type="submit" className="w-full bg-navy-core text-white font-semibold py-3 px-4 rounded-lg hover:bg-navy-deepest transition-colors disabled:opacity-70" disabled={loading || code.join('').length < 6}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-[0.88rem] text-text-muted hover:text-navy-core transition-colors">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
