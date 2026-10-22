import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/error';

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
    <main className="auth-page">
      <div className="page-header full-width">
        <h1>Registration</h1>
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
        <div>
          <label>
            Name (optional)
            <br />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="full-width"
            />
          </label>
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
        <div>
          Already have account?{' '}
          <Link to="/login" state={{ from }}>
            Login
          </Link>
        </div>
      </form>
    </main>
  );
}
