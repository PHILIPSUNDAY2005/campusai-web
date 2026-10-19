import Link from 'next/link';
import Logo from './Logo';
import Footer from './Footer';
import styles from './AuthShell.module.css';

export default function AuthShell({
  title,
  tagline,
  children,
  footerText,
  footerLinkText,
  footerHref,
}) {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Logo size={72} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.tagline}>{tagline}</p>

        <div className={styles.card}>{children}</div>

        <p className={styles.footer}>
          {footerText}{' '}
          <Link href={footerHref} className={styles.footerLink}>
            {footerLinkText}
          </Link>
        </p>

        <Footer />
      </div>
    </main>
  );
}