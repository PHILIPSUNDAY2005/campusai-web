'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();

  // The chat page is a full-height screen with its own input bar
  if (pathname && pathname.startsWith('/chat')) {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.brand}>
          <strong>CampusAI</strong> · Built by Bayode Philip Sunday · Level 300 Computer Science · RSMST
        </p>
        <nav className={styles.links} aria-label="Legal">
          <Link href="/terms">Terms and Conditions</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </nav>
        <p className={styles.copy}>© 2026 CampusAI. All rights reserved.</p>
      </div>
    </footer>
  );
}
