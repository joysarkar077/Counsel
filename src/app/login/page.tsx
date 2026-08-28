'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../auth.module.css';

export default function LoginPage() {
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
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to login');
      }

      setSuccess(true);
      // In a real app we'd redirect to dashboard here
      // setTimeout(() => router.push('/dashboard'), 1500);
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
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to access your secure dashboard.</p>
        </div>

        {error && <div style={{ color: 'var(--error-color)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
        {success && <div style={{ color: 'var(--success-color)', marginBottom: '16px', textAlign: 'center' }}>Login successful!</div>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com" disabled={loading} />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" disabled={loading} />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        <div className={styles.footer}>
          Don't have an account? 
          <Link href="/register" className={styles.link}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
