import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reviewsLogo from '../logo.svg';
import Avatar from './Avatar';
import styles from './Header.module.css';

export function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  const toggleTheme = () => {
    setTheme(nextTheme);
    try {
      localStorage.setItem('reviews-theme', nextTheme);
    } catch {}
  };

  return (
    <header className="page-header">
      <Link to="/" className={styles.brandLink}>
        <span className={styles.logoWindow}>
          <img src={reviewsLogo} alt="" />
        </span>
        <h1 className={styles.brandName}>ReviHub</h1>
      </Link>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.themeToggle}
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user ? (
          <>
            <Avatar user={user} size="md" />
            <span className={styles.greeting}>
              Hi, {user.name || `Anon #${user.id}`}
            </span>
            <button
              type="button"
              className="button-link"
              onClick={() => void logout()}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="button-link"
              state={{ from: location.pathname }}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="button-link"
              state={{ from: location.pathname }}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
