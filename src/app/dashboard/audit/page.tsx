'use client';
import styles from './audit.module.css';

// Dummy data to visualize the hash-chained audit log that Farjana will build
const DUMMY_LOGS = [
  {
    id: 'log_004',
    timestamp: '2026-08-28T14:32:00Z',
    userBlindIndex: 'a7b8c9d0...e1f2',
    action: 'MESSAGE_SENT',
    ip: '192.168.1.105',
    integrity: 'valid',
    hash: '0xabc123...',
  },
  {
    id: 'log_003',
    timestamp: '2026-08-28T10:15:22Z',
    userBlindIndex: 'b2c3d4e5...f6a7',
    action: 'USER_LOGIN',
    ip: '10.0.0.42',
    integrity: 'valid',
    hash: '0xdef456...',
  },
  {
    id: 'log_002',
    timestamp: '2026-08-27T09:00:11Z',
    userBlindIndex: 'c3d4e5f6...a7b8',
    action: 'PROFILE_UPDATED',
    ip: '192.168.1.105',
    integrity: 'valid',
    hash: '0x789ghi...',
  },
  {
    id: 'log_001',
    timestamp: '2026-08-27T08:55:00Z',
    userBlindIndex: 'a7b8c9d0...e1f2',
    action: 'CASE_REQUEST_SUBMITTED',
    ip: '192.168.1.105',
    integrity: 'valid',
    hash: '0x000000...',
  },
];

export default function AuditLogPage() {
  return (
    <div className="animate-fade-up">
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Audit Log</h1>
          <p className={styles.subtitle}>Immutable, hash-chained record of all critical system actions.</p>
        </div>
        <div className={styles.integrityBadge}>
          <span className={styles.pulse}></span>
          Chain Integrity: Verified
        </div>
      </div>

      <div className={`card ${styles.tableCard}`}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor (Blind Index)</th>
                <th>Action</th>
                <th>IP Address</th>
                <th>Integrity</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_LOGS.map((log) => (
                <tr key={log.id}>
                  <td className={styles.timestamp}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className={styles.mono}>{log.userBlindIndex}</td>
                  <td>
                    <span className={styles.actionBadge}>{log.action}</span>
                  </td>
                  <td className={styles.mono}>{log.ip}</td>
                  <td>
                    {log.integrity === 'valid' ? (
                      <span className={styles.statusValid}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                          <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Valid
                      </span>
                    ) : (
                      <span className={styles.statusBroken}>Broken</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.tableFooter}>
          <p>Displaying latest 4 records. Hash chain verification is performed on the server.</p>
        </div>
      </div>
    </div>
  );
}
