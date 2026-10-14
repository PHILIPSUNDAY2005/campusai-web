import MainNav from '../../components/MainNav';
import styles from './layout.module.css';

export default function MainLayout({ children }) {
  return (
    <div className={styles.shell}>
      <MainNav />
      <div className={styles.content}>{children}</div>
    </div>
  );
}