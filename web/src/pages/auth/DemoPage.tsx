import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Header } from '../../components/layout/Header';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';

// Opened from the demo link: signs in to a new demo account and goes to
// the catalog. A visitor who is already signed in just goes to the catalog
export default function DemoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loginDemo } = useAuth();
  const [error, setError] = useState('');
  // Each POST /auth/demo creates a new account, so the effect must run once:
  // it would rerun when the URL or the signed-in user changes, and StrictMode
  // in development runs it twice.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const key = searchParams.get('key');
    if (user) {
      navigate('/', { replace: true });
      return;
    }
    if (!key) {
      setError('This demo link is incomplete.');
      return;
    }

    loginDemo(key)
      .then(() => navigate('/', { replace: true }))
      .catch((err) => {
        setError(getErrorMessage(err));
        navigate('/demo', { replace: true });
      });
  }, [searchParams, user, loginDemo, navigate]);

  return (
    <main>
      <Header />
      <section className="page-section">
        {error ? (
          <>
            <h2>Demo link didn't work</h2>
            <div className="error-message">{error}</div>
            <Link to="/">Browse the titles as a guest</Link>
          </>
        ) : (
          <p>Opening the demo...</p>
        )}
      </section>
    </main>
  );
}
