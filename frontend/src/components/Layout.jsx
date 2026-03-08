import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

/**
 * Main layout wrapper for authenticated pages (Scan, Payment, Invoice).
 * Shows header with store name.
 */
export default function Layout() {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Smart Store</h1>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
