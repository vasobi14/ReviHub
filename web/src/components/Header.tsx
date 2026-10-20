import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import reviewsLogo from '../logo.svg';
import Avatar from './Avatar';

export function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    localStorage.getItem('reviews-theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('reviews-theme', theme);
  }, [theme]);

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <header className="page-header">
      <Link to="/" className="brand-link">
        <span className="brand-logo-window">
          <img src={reviewsLogo} alt="" />
        </span>
        <h1 className="brand-name">Revihub</h1>
      </Link>
      <div className="page-header-actions">
        <button
          type="button"
          className="theme-toggle"
          aria-label={`Switch to ${nextTheme} theme`}
          title={`Switch to ${nextTheme} theme`}
          onClick={() => setTheme(nextTheme)}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user ? (
          <>
            <Avatar user={user} size="md" />
            <span className="user-greeting">
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
