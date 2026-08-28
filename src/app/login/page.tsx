'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

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

      // Redirect based on role
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
    <div className={styles.authWrapper}>
      {/* Left: Branding panel */}
      <div className={styles.brandPanel}>
        <Link href="/" className={styles.brandTop}>
          <span className={styles.brandLogo}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={styles.brandLogoIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Counsel
          </span>
        </Link>

        <div className={styles.brandMiddle}>
          <h2 className={styles.brandTitle}>
            Secure legal<br />case management.
          </h2>
          <p className={styles.brandSubtitle}>
            Every record encrypted. Every action audited.<br />
            Access requires two-factor verification.
          </p>
        </div>

        <div className={styles.brandBottom}>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            RSA-encrypted personal data
          </div>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            TOTP two-factor authentication
          </div>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            Hash-chained tamper-evident audit log
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className={styles.formPanel}>
        <div className={`${styles.formInner} animate-fade-up`}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Welcome back</h1>
            <p className={styles.formSubtitle}>Sign in to your Counsel account.</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="sajid.mahir@example.com"
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>

          <hr className={styles.divider} />

          <div className={styles.footer}>
            Don't have an account?
            <Link href="/register" className={styles.footerLink}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
