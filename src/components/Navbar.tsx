'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) return null;

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={styles.logoIcon}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Counsel
        </Link>

        <div className={styles.links}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#security" className={styles.navLink}>Security</Link>
          <Link href="#about" className={styles.navLink}>About</Link>
        </div>

        <div className={styles.cta}>
          <Link href="/login" className={`btn-outline ${styles.loginBtn}`}>Sign In</Link>
          <Link href="/register" className={`btn-primary ${styles.registerBtn}`}>Get Started</Link>
        </div>
      </div>
    </nav>
  );
}
