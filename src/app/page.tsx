import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={`glass-panel ${styles.hero}`}>
        <div className={styles.iconContainer}>
          <svg className={styles.shield} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h1 className={styles.title}>Counsel</h1>
        <p className={styles.subtitle}>
          Secure, cryptographic legal case management.
          <br/>Built with a zero-trust architecture.
        </p>
        
        <div className={styles.actions}>
          <Link href="/login" className="btn-primary">
            Login
          </Link>
          <Link href="/register" className={styles.btnSecondary}>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
