'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        throw new Error(errorData.error || 'Failed to register');
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={`glass-panel ${styles.authCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Counsel to manage your legal cases securely.</p>
        </div>
        
        {error && <div style={{ color: 'var(--error-color)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success-color)', marginBottom: '16px', textAlign: 'center' }}>Registered successfully! Redirecting...</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Full Name</label>
            <input type="text" id="username" name="username" required placeholder="John Doe" disabled={loading} />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com" disabled={loading} />
          </div>
          <div className="input-group">
            <label htmlFor="contact">Phone Number</label>
            <input type="tel" id="contact" name="contact" required placeholder="+1 234 567 8900" disabled={loading} />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" disabled={loading} />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
            {loading ? 'Generating RSA Keys...' : 'Register & Generate Keys'}
          </button>
        </form>
        
        <div className={styles.footer}>
          Already have an account? 
          <Link href="/login" className={styles.link}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
