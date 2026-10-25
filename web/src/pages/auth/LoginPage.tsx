import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import AuthPanel from '../../components/layout/AuthPanel';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';

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
    <AuthPanel
      title="Log in"
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" state={{ from }}>
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form-fields">
        <label className="field">
          <span className="field-label">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
    </AuthPanel>
  );
}
