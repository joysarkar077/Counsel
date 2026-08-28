'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './verify2fa.module.css';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return; // digits only
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // Auto-advance
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
      // TODO (Farjana - TOTP): Wire up POST /api/auth/verify-2fa once TOTP module is ready
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid code');
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={`card animate-fade-up ${styles.card}`}>
        <div className={styles.iconWrap}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <h1 className={styles.title}>Two-Factor Verification</h1>
        <p className={styles.subtitle}>
          Enter the 6-digit code from your authenticator app.
        </p>

        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.otpRow} onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                className={styles.otpInput}
                onChange={(e) => handleChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                disabled={loading}
                autoFocus={i === 0}
                id={`otp-${i}`}
              />
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading || code.join('').length < 6}>
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
        </form>

        <div className={styles.footer}>
          <Link href="/login" className={styles.back}>← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
