import Link from 'next/link';
import styles from '../auth.module.css';

export default function RegisterPage() {
  return (
    <div className={styles.authContainer}>
      <div className={`glass-panel ${styles.authCard}`}>
        <div className={styles.header}>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join Counsel to manage your legal cases securely.</p>
        </div>
        
        <form className={styles.form}>
          <div className="input-group">
            <label htmlFor="username">Full Name</label>
            <input type="text" id="username" name="username" required placeholder="John Doe" />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" required placeholder="john@example.com" />
          </div>
          <div className="input-group">
            <label htmlFor="contact">Phone Number</label>
            <input type="tel" id="contact" name="contact" required placeholder="+1 234 567 8900" />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" />
          </div>
          
          <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
            Register & Generate Keys
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
