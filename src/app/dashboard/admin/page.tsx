import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminDashboardPage() {
  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>System Administration</h1>
          <p className={styles.subtitle}>Supervise users, assign cases, and monitor system health.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={`btn-primary ${styles.actionBtn}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Invite Lawyer
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIconWrap}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Total Users</p>
            <p className={styles.statValue}>12</p>
          </div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIconWrap} style={{ color: 'var(--gold-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>Total Cases</p>
            <p className={styles.statValue}>4</p>
          </div>
        </div>
        
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIconWrap} style={{ color: '#10B981' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.statIcon}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <p className={styles.statLabel}>System Health</p>
            <p className={styles.statValue}>100%</p>
          </div>
        </div>
      </div>

      <div className={styles.splitLayout}>
        <div className={styles.mainCol}>
          <div className={styles.sectionHeader}>
            <h2>Pending Cases (Needs Assignment)</h2>
          </div>
          
          <div className={`card ${styles.pendingCard}`}>
            <div className={styles.pendingItem}>
              <div className={styles.pendingInfo}>
                <span className={styles.caseId}>CASE-004</span>
                <span className={styles.caseTitle}>Breach of Contract Dispute</span>
                <span className={styles.caseDate}>Submitted 2 hours ago</span>
              </div>
              <button className={`btn-primary ${styles.assignBtn}`}>Assign Lawyer</button>
            </div>
            
            <div className={styles.divider}></div>
            
            <div className={styles.pendingItem}>
              <div className={styles.pendingInfo}>
                <span className={styles.caseId}>CASE-005</span>
                <span className={styles.caseTitle}>Intellectual Property Review</span>
                <span className={styles.caseDate}>Submitted 5 hours ago</span>
              </div>
              <button className={`btn-primary ${styles.assignBtn}`}>Assign Lawyer</button>
            </div>
          </div>
        </div>
        
        <div className={styles.sideCol}>
          <div className={styles.sectionHeader}>
            <h2>Recent Activity</h2>
          </div>
          <div className={`card ${styles.activityCard}`}>
            <div className={styles.activityItem}>
              <div className={styles.activityDot}></div>
              <p>Lawyer <strong>JD</strong> updated CASE-002</p>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityDot} style={{ background: 'var(--gold-muted)'}}></div>
              <p>New case requested by client</p>
            </div>
            <div className={styles.activityItem}>
              <div className={styles.activityDot} style={{ background: '#10B981'}}></div>
              <p>System Initialized</p>
            </div>
            
            <Link href="/dashboard/audit" className={styles.viewAuditLink}>
              View Full Audit Log &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
