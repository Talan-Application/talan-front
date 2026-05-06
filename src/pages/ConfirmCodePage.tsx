import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { getApiErrorMessage } from '../utils/error';
import { OtpInput } from '../components/OtpInput';
import './auth.css';

interface LocationState {
  email: string;
  flow: 'login' | 'register';
}

export function ConfirmCodePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuth();

  const state = location.state as LocationState | null;
  const email =
    state?.email ?? sessionStorage.getItem('talan_pending_email') ?? '';
  const flow: LocationState['flow'] =
    state?.flow ?? (sessionStorage.getItem('talan_pending_flow') as LocationState['flow']) ?? 'login';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!email) navigate('/login', { replace: true });
  }, [email, navigate]);

  const code = digits.join('');
  const isComplete = code.length === 6 && digits.every((d) => d !== '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isComplete || loading) return;
    setError('');
    setLoading(true);

    try {
      sessionStorage.removeItem('talan_pending_email');
      sessionStorage.removeItem('talan_pending_flow');
      if (flow === 'register') {
        await authApi.verifyEmail({ email, code });
        navigate('/login', { replace: true, state: { verified: true } });
      } else {
        const { data } = await authApi.verifyLogin({ email, code });
        setAuthData(data);
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
      setDigits(Array(6).fill(''));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMsg('');
    setError('');
    setResending(true);
    try {
      await authApi.resendCode(email);
      setResendMsg('A new code has been sent to your email.');
      setDigits(Array(6).fill(''));
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {resendMsg && <div className="auth-success">{resendMsg}</div>}

          <OtpInput digits={digits} onChange={setDigits} disabled={loading} />

          <button
            className="auth-btn"
            type="submit"
            disabled={!isComplete || loading}
          >
            {loading ? 'Verifying…' : 'Verify code'}
          </button>
        </form>

        <div className="auth-footer">
          Didn't receive a code?{' '}
          <button
            className="auth-link-btn"
            type="button"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending…' : 'Resend'}
          </button>
        </div>
      </div>
    </div>
  );
}
