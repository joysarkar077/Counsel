import Link from 'next/link';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <h1 className={styles.title}>Overview</h1>
        <p className={styles.subtitle}>Welcome back. Here's what's happening with your cases.</p>
      </div>

      <div className={styles.grid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIconWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Active Cases</p>
            <p className={styles.statValue}>0</p>
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIconWrap} style={{ color: 'var(--gold-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Upcoming Hearings</p>
            <p className={styles.statValue}>0</p>
          </div>
        </div>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIconWrap} style={{ color: '#0F1F3D' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Unread Messages</p>
            <p className={styles.statValue}>0</p>
          </div>
        </div>
      </div>

      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2>Recent Cases</h2>
          <Link href="/dashboard/cases" className={styles.viewAll}>View All</Link>
        </div>
        
        <div className={`card ${styles.emptyState}`}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </div>
          <h3>No cases found</h3>
          <p>You haven't submitted or been assigned to any cases yet.</p>
          <Link href="/dashboard/cases/new" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Submit a Request
          </Link>
        </div>
      </div>
    </div>
  );
}
