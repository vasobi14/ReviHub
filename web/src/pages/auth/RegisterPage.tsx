import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import AuthPanel from '../../components/layout/AuthPanel';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/error';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, name);
      navigate(`/verify-email?email=${encodeURIComponent(email)}`, {
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      title="Create account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" state={{ from }}>
            Log in
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">Name</span>
          <input
            type="text"
            autoComplete="nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <span className="field-hint">Optional, shown with your reviews</span>
        </label>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="button-primary" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthPanel>
  );
}
