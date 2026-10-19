'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';

export default function Footer() {
  const pathname = usePathname();

  // The chat page fills the whole screen, so it has no footer
  if (pathname === '/chat') {
    return null;
  }

  return (
    <footer className={styles.footer}>
      <p className={styles.brand}>CampusAI &middot; Your AI Study Assistant</p>
      <p className={styles.line}>
        Built by Philip Sunday &middot; Level 300 Computer Science &middot; Riverdale School of
        Management Science and Technology (RSMST)
      </p>
      <p className={styles.links}>
        <Link href="/terms">Terms and Conditions</Link>
        <span aria-hidden="true"> &middot; </span>
        <Link href="/privacy">Privacy Policy</Link>
      </p>
      <p className={styles.small}>
        &copy; 2026 CampusAI. AI answers can contain mistakes, so check important information
        with your lecture notes and lecturers.
      </p>
    </footer>
  );
}
