import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Dashboard</h1>
        <p className={styles.subtitle}>Welcome to Counsel. Your case files and messages are all encrypted at rest.</p>
      </div>

      <div className={styles.grid}>
        <div className={`card ${styles.statCard}`}>
          <p className={styles.statLabel}>Active Cases</p>
          <p className={styles.statValue}>0</p>
        </div>
        <div className={`card ${styles.statCard}`}>
          <p className={styles.statLabel}>Pending Review</p>
          <p className={styles.statValue}>0</p>
        </div>
        <div className={`card ${styles.statCard}`}>
          <p className={styles.statLabel}>Closed Cases</p>
          <p className={styles.statValue}>0</p>
        </div>
      </div>

      <div className={`card ${styles.emptyState}`}>
        <p>You have no cases yet.</p>
        <Link href="/cases/new" className="btn-primary" style={{ width: 'auto', marginTop: '16px', padding: '10px 24px' }}>
          Submit a Case Request
        </Link>
      </div>
    </div>
  );
}
