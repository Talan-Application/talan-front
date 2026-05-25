import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api';
import { getApiErrorMessage } from '../../utils/error';
import { STORAGE_KEYS, ROUTES } from '../../constants';
import './auth.css';

function validateEmail(value: string): string {
  if (!value.trim()) return 'validation.emailRequired';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'validation.emailInvalid';
  return '';
}

function validatePassword(value: string): string {
  if (!value) return 'validation.passwordRequired';
  if (value.length < 6) return 'validation.passwordTooShort';
  return '';
}

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(next);
    return !next.email && !next.password;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await authApi.login({ email, password });
      sessionStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, email);
      sessionStorage.setItem(STORAGE_KEYS.PENDING_FLOW, 'login');
      navigate(ROUTES.CONFIRM_CODE, { state: { email, flow: 'login' } });
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.login.title')}</h1>
        <p className="auth-subtitle">{t('auth.login.subtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="auth-error">{apiError}</div>}

          <div className="form-group">
            <label className="form-label" htmlFor="email">{t('auth.login.email')}</label>
            <input
              id="email"
              className={`form-input${errors.email ? ' form-input-error' : ''}`}
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setErrors(prev => ({ ...prev, email: validateEmail(email) }))}
              autoComplete="email"
            />
            {errors.email && <span className="form-field-error">{t(errors.email)}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('auth.login.password')}</label>
            <input
              id="password"
              className={`form-input${errors.password ? ' form-input-error' : ''}`}
              type="password"
              placeholder={t('auth.login.passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setErrors(prev => ({ ...prev, password: validatePassword(password) }))}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-field-error">{t(errors.password)}</span>}
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
          </button>
        </form>

        <div className="auth-footer">
          {t('auth.login.noAccount')} <Link to={ROUTES.REGISTER}>{t('auth.login.createOne')}</Link>
        </div>
      </div>
    </div>
  );
}
