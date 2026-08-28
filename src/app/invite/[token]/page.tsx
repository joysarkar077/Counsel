'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import styles from '../../auth.module.css';

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
    <div className={styles.authWrapper}>
      {/* Left branding panel */}
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
            You've been<br />invited to Counsel.
          </h2>
          <p className={styles.brandSubtitle}>
            Set a password to activate your {role} account.<br />
            Your RSA keypair will be generated automatically.
          </p>
        </div>

        <div className={styles.brandBottom}>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            Invitation verified via HMAC
          </div>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            RSA keypair generated on activation
          </div>
          <div className={styles.brandFeature}>
            <span className={styles.brandFeatureDot} />
            Password never stored in plaintext
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className={styles.formPanel}>
        <div className={`${styles.formInner} animate-fade-up`}>
          {fetching ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Verifying invitation…</p>
          ) : invalid ? (
            <div>
              <div className="alert-error">This invitation link is invalid or has already been used.</div>
              <Link href="/" className="btn-outline" style={{ marginTop: '16px' }}>Back to Home</Link>
            </div>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1 className={styles.formTitle}>Activate your account</h1>
                <p className={styles.formSubtitle}>
                  Invited as <strong>{role}</strong> · {email}
                </p>
              </div>

              {error && <div className="alert-error">{error}</div>}

              <form className={styles.form} onSubmit={handleSubmit} noValidate>
                <div className="input-group">
                  <label htmlFor="password">New Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    placeholder="Create a strong password"
                    disabled={loading}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="confirm">Confirm Password</label>
                  <input
                    type="password"
                    id="confirm"
                    name="confirm"
                    required
                    placeholder="Repeat your password"
                    disabled={loading}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '8px' }} disabled={loading}>
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
