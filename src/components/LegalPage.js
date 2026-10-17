import Link from 'next/link';
import Logo from './Logo';
import styles from './LegalPage.module.css';

// The shared layout for the Terms and Privacy pages
export default function LegalPage({ title, updated, children }) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/signup" className={styles.back}>
          ← Back to Sign Up
        </Link>

        <div className={styles.logo}>
          <Logo size={44} showName />
        </div>

        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated: {updated}</p>

        <div className={styles.body}>{children}</div>
      </div>
    </main>
  );
}