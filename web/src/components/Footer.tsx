import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.column}>
          <span className={styles.brand}>ReviHub</span>
        </div>
        <nav className={styles.column} aria-label="Footer navigation">
          <Link to="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link to="/cookies" className={styles.link}>
            Cookie Policy
          </Link>
        </nav>

        <div className={styles.column}>
          <a
            href="https://github.com/vasobi14/ReviHub/"
            target="_blank"
            rel="noreferrer noopener"
            className={styles.icon}
            aria-label="GitHub repository"
          >
            Github
          </a>{' '}
          <a
            href="mailto:vasobi14@gmail.com"
            className={styles.icon}
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
