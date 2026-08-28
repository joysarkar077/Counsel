import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <div className={`card animate-fade-up ${styles.card}`}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.subtitle}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn-primary" style={{ width: 'auto', padding: '11px 28px' }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
