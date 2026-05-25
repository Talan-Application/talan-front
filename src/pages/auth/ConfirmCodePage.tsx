import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api';
import { useAuthStore } from '../../stores/authStore';
import { getApiErrorMessage } from '../../utils/error';
import { STORAGE_KEYS, ROUTES } from '../../constants';
import { OtpInput } from '../../components/OtpInput';
import './auth.css';

type Flow = 'login' | 'register';

interface LocationState {
  email: string;
  flow: Flow;
}

export function ConfirmCodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthData } = useAuthStore();

  const state = location.state as LocationState | null;
  const email = state?.email ?? sessionStorage.getItem(STORAGE_KEYS.PENDING_EMAIL) ?? '';
  const flow: Flow = state?.flow ?? (sessionStorage.getItem(STORAGE_KEYS.PENDING_FLOW) as Flow) ?? 'login';

  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (!email) navigate(ROUTES.LOGIN, { replace: true });
  }, [email, navigate]);

  const code = digits.join('');
  const isComplete = code.length === 6 && digits.every(d => d !== '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isComplete || loading) return;
    setError('');
    setLoading(true);
    try {
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_EMAIL);
      sessionStorage.removeItem(STORAGE_KEYS.PENDING_FLOW);
      if (flow === 'register') {
        await authApi.verifyEmail({ email, code });
        navigate(ROUTES.LOGIN, { replace: true, state: { verified: true } });
      } else {
        const { data } = await authApi.verifyLogin({ email, code });
        setAuthData(data);
        navigate(ROUTES.HOME, { replace: true });
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
      setResendMsg(t('auth.confirmCode.resendSuccess'));
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
        <h1 className="auth-title">{t('auth.confirmCode.title')}</h1>
        <p className="auth-subtitle">
          {t('auth.confirmCode.subtitle')} <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          {resendMsg && <div className="auth-success">{resendMsg}</div>}

          <OtpInput digits={digits} onChange={setDigits} disabled={loading} />

          <button className="auth-btn" type="submit" disabled={!isComplete || loading}>
            {loading ? t('auth.confirmCode.verifying') : t('auth.confirmCode.verify')}
          </button>
        </form>

        <div className="auth-footer">
          {t('auth.confirmCode.noCode')}{' '}
          <button
            className="auth-link-btn"
            type="button"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? t('auth.confirmCode.resending') : t('auth.confirmCode.resend')}
          </button>
        </div>
      </div>
    </div>
  );
}
