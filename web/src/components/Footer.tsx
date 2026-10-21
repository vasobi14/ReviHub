import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-column">
          <span className="site-footer-brand">ReviHub</span>
          <span className="site-footer-muted">
            © {new Date().getFullYear()} ReviHub App
          </span>
        </div>
        <nav className="site-footer-column" aria-label="Footer navigation">
          <Link to="/privacy" className="site-footer-link">
            Privacy Policy
          </Link>
          <Link to="/cookies" className="site-footer-link">
            Cookie Policy
          </Link>
        </nav>

        <div className="site-footer-column">
          <a
            href="https://github.com/vasobi14/"
            target="_blank"
            rel="noreferrer noopener"
            className="site-footer-icon"
            aria-label="GitHub repository"
          >
            Github
          </a>{' '}
          <a
            href="mailto:vasobi14@gmail.com"
            className="site-footer-icon"
            aria-label="Email"
          >
            <Mail size={20} />
          </a>
        </div>
      </div>
    </footer>
  );
}
