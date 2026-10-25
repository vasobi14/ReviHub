import { NavLink } from 'react-router';
import styles from './AdminNav.module.css';

export default function AdminNav() {
  const className = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <nav className={styles.nav} aria-label="Admin">
      <NavLink to="/admin" end className={className}>
        Users
      </NavLink>
      <NavLink to="/admin/analytics" className={className}>
        Analytics
      </NavLink>
    </nav>
  );
}
