import Link from 'next/link';
import styles from './page.module.css';

const features = [
  {
    icon: '🔐',
    title: 'RSA-Encrypted PII',
    desc: 'Your name, email, and contact details are encrypted with RSA before being stored. Nobody — not even the database admin — can read your personal data.',
  },
  {
    icon: '⚖️',
    title: 'Full Case Lifecycle',
    desc: 'From submission to closure, every case follows a strict, audited state machine: Pending → Active → Close Requested → Closed.',
  },
  {
    icon: '🔑',
    title: 'Two-Factor Auth (TOTP)',
    desc: 'Login requires your password and a 30-second rotating code. A stolen password alone is not enough to break in.',
  },
  {
    icon: '🛡️',
    title: 'Tamper-Evident Records',
    desc: 'Every record (case notes, messages, hearings) has an HMAC fingerprint. Any tampering is instantly detectable.',
  },
  {
    icon: '💬',
    title: 'Private Lawyer–Client Messaging',
    desc: 'End-to-end encrypted messages between each client and their assigned lawyer, invisible to other parties on the same case.',
  },
  {
    icon: '📋',
    title: 'Role-Based Access Control',
    desc: 'Clients, Lawyers, and Admins each operate within a strictly enforced permission matrix. No role can exceed its boundaries.',
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>Bangladesh's Secure Legal Platform</span>
          <h1 className={styles.heroTitle}>
            Legal case management
            <br />
            <span className={styles.heroGold}>built on cryptographic trust.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Counsel is a zero-trust legal case management system where every record is encrypted, every action is signed, and every piece of sensitive data is cryptographically protected.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register" className="btn-primary" style={{ width: 'auto', padding: '13px 32px', fontSize: '1rem' }}>
              Get Started — It's Free
            </Link>
            <Link href="/login" className="btn-outline" style={{ padding: '13px 32px', fontSize: '1rem' }}>
              Sign In
            </Link>
          </div>
        </div>
        <div className={styles.heroBrand}>
          <div className={styles.brandPanel}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.brandIcon}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <p className={styles.brandName}>Counsel</p>
            <p className={styles.brandTagline}>"Your case. Your trust. Secured."</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={styles.featuresSection} id="features">
        <div className={styles.sectionHeader}>
          <span className={styles.sectionBadge}>Features</span>
          <h2 className={styles.sectionTitle}>Everything encrypted. Everything audited.</h2>
          <p className={styles.sectionSubtitle}>
            Counsel was designed from the ground up for legal professionals who cannot afford a data breach.
          </p>
        </div>
        <div className={styles.featuresGrid}>
          {features.map((f) => (
            <div key={f.title} className={`card ${styles.featureCard}`}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Security Section */}
      <section className={styles.securitySection} id="security">
        <div className={styles.securityInner}>
          <div className={styles.securityText}>
            <span className={styles.sectionBadge}>Zero-Trust Architecture</span>
            <h2 className={styles.sectionTitle}>Even a full database breach leaks nothing.</h2>
            <p className={styles.sectionSubtitle}>
              All personal identifiable information — names, emails, phone numbers — is encrypted with RSA before it is written to the database. All case content uses ECC-based ECIES encryption. Passwords are never stored; only a custom-iterated hash is kept.
            </p>
            <ul className={styles.securityList}>
              <li>✓ RSA-encrypted PII (names, email, contact)</li>
              <li>✓ ECC/ECIES-encrypted case content, notes, messages</li>
              <li>✓ HMAC integrity fingerprints on every record</li>
              <li>✓ TOTP two-factor authentication</li>
              <li>✓ Hash-chained, tamper-evident audit log</li>
            </ul>
          </div>
          <div className={styles.securityVisual}>
            <div className={styles.securityCard}>
              <div className={styles.secLine}><span className={styles.secLabel}>Name</span> <span className={styles.secValue}>3a9f1b2c…</span></div>
              <div className={styles.secLine}><span className={styles.secLabel}>Email</span> <span className={styles.secValue}>8f2d0e5a…</span></div>
              <div className={styles.secLine}><span className={styles.secLabel}>Case</span> <span className={styles.secValue}>c4b7f91e…</span></div>
              <div className={styles.secLine}><span className={styles.secLabel}>Message</span> <span className={styles.secValue}>7a3f1902…</span></div>
              <div className={styles.secFooter}>All fields encrypted at rest</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to secure your legal practice?</h2>
          <p className={styles.ctaSubtitle}>Join Counsel today. Registration is free.</p>
          <Link href="/register" className="btn-gold" style={{ padding: '14px 40px', fontSize: '1rem' }}>
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 Counsel. Secure Legal Case Management System</p>
      </footer>
    </div>
  );
}
