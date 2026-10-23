import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './AuthPanel.module.css';
import { Header } from './Header';

interface AuthPanelProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthPanel({ title, children, footer }: AuthPanelProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  return (
    <main>
      <Header />
      <div className={styles.panel}>
        <button
          type="button"
          className="button-text"
          onClick={() => navigate(from, { replace: true })}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>
        <h1 className={styles.title}>{title}</h1>
        {children}
        {footer && <p className={styles.footer}>{footer}</p>}
      </div>
    </main>
  );
}
