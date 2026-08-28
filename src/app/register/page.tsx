'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

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

      // Redirect to login on success
      router.push('/login?registered=true');
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
            Start managing<br />cases securely.
          </h2>
          <p className={styles.brandSubtitle}>
            Your account generates its own RSA keypair.<br />
            Personal data is encrypted before it is stored.
          </p>
        </div>

        <div className={styles.brandBottom}>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            RSA keypair generated on registration
          </div>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            Name, email & phone encrypted immediately
          </div>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            Password never stored in plaintext
          </div>
        </div>
      </div>

      {/* Right: Form panel */}
      <div className={styles.formPanel}>
        <div className={`${styles.formInner} animate-fade-up`}>
          <div className={styles.formHeader}>
            <h1 className={styles.formTitle}>Create your account</h1>
            <p className={styles.formSubtitle}>All fields are encrypted before being saved.</p>
          </div>

          {error && <div className="alert-error">{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="username">Full Name</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                placeholder="Sajid Mahir"
                disabled={loading}
                autoComplete="name"
              />
            </div>
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
              <label htmlFor="contact">Phone Number</label>
              <input
                type="tel"
                id="contact"
                name="contact"
                required
                placeholder="+880 1711-234567"
                disabled={loading}
                autoComplete="tel"
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Create a strong password"
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
              {loading ? 'Generating RSA Keys & Registering…' : 'Create Secure Account'}
            </button>
          </form>

          <hr className={styles.divider} />

          <div className={styles.footer}>
            Already have an account?
            <Link href="/login" className={styles.footerLink}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
