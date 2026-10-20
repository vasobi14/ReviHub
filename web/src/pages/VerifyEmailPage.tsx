import { useEffect, useState } from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { resendVerification, verifyEmail } from '../api';
import { getErrorMessage } from '../utils/error';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') ?? '';

  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      await verifyEmail(email, code);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await resendVerification(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (!email) {
    return (
      <main className="register-page">
        <div className="page-header full-width">
          <h1>Verify email</h1>
          <button type="button" onClick={() => navigate(from, { replace: true })}>
            Return
          </button>
        </div>
        <p>
          Missing email. Go back to <Link to="/register">registration</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="register-page">
      <div className="page-header full-width">
        <h1>Verify your email</h1>
        <button type="button" onClick={() => navigate(from, { replace: true })}>
          Return
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="form-stack form-narrow full-width"
      >
        <p>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
        </p>

        <div>
          <label>
            Code
            <br />
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="\d{6}"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
              }
              required
              className="full-width"
            />
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && (
          <div className="success-message">
            Email verified! Redirecting to login...
          </div>
        )}

        <button type="submit" disabled={verifying || code.length !== 6}>
          {verifying ? 'Verifying...' : 'Verify'}
        </button>

        <div>
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
          </button>
        </div>
      </form>
    </main>
  );
}
