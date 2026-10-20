import AuthGate from '../../components/AuthGate';
import MainNav from '../../components/MainNav';
import Footer from '../../components/Footer';
import styles from './layout.module.css';

export default function MainLayout({ children }) {
  return (
    <AuthGate>
      <div className={styles.shell}>
        <MainNav />
        <main className={styles.content}>{children}</main>
        <Footer />
      </div>
    </AuthGate>
  );
}
