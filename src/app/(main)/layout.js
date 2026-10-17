import AuthGate from '../../components/AuthGate';
import MainNav from '../../components/MainNav';
import styles from './layout.module.css';

export default function MainLayout({ children }) {
  return (
    <AuthGate>
      <div className={styles.shell}>
        <MainNav />
        <div className={styles.content}>{children}</div>
      </div>
    </AuthGate>
  );
}