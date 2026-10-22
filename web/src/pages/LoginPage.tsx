import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err);
      const code =
        err instanceof Error && 'code' in err
          ? (err as { code?: string }).code
          : undefined;

      if (code === 'EMAIL_NOT_VERIFIED') {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
          replace: true,
        });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="page-header full-width">
        <h1>Login</h1>
        <button type="button" onClick={() => navigate(from, { replace: true })}>
          Return
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="form-stack form-narrow full-width"
      >
        <div>
          <label>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="full-width"
            />
          </label>
        </div>
        <div>
          <label>
            Password
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="full-width"
            />
          </label>
        </div>
        {error && <div className="error-message">Error: {error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
        <div>
          Don't have account?{' '}
          <Link to="/register" state={{ from }}>
            Register
          </Link>
        </div>
      </form>
    </main>
  );
}
