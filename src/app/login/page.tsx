import Link from 'next/link';
import styles from '../auth.module.css';

export default function LoginPage() {
  return (
    <div className={styles.authContainer}>
      <div className={`glass-panel ${styles.authCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to access your secure dashboard.</p>
        </div>
        
        <form className={styles.form}>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
            Sign In
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
