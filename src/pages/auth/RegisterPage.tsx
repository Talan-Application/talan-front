import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api';
import { getApiErrorMessage } from '../../utils/error';
import { STORAGE_KEYS, ROUTES } from '../../constants';
import './auth.css';

interface FormState {
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  password: string;
}

interface FormErrors {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

const EMPTY_FORM: FormState = { email: '', first_name: '', last_name: '', middle_name: '', password: '' };
const EMPTY_ERRORS: FormErrors = { email: '', first_name: '', last_name: '', password: '' };

function validateField(name: keyof FormErrors, value: string): string {
  if (name === 'email') {
    if (!value.trim()) return 'validation.emailRequired';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'validation.emailInvalid';
  }
  if (name === 'first_name' && !value.trim()) return 'validation.firstNameRequired';
  if (name === 'last_name' && !value.trim()) return 'validation.lastNameRequired';
  if (name === 'password') {
    if (!value) return 'validation.passwordRequired';
    if (value.length < 6) return 'validation.passwordTooShort';
  }
  return '';
}

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>(EMPTY_ERRORS);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleBlur(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name in errors) {
      setErrors(prev => ({ ...prev, [name]: validateField(name as keyof FormErrors, value) }));
    }
  }

  function validate(): boolean {
    const next: FormErrors = {
      email: validateField('email', form.email),
      first_name: validateField('first_name', form.first_name),
      last_name: validateField('last_name', form.last_name),
      password: validateField('password', form.password),
    };
    setErrors(next);
    return Object.values(next).every(e => !e);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        ...(form.middle_name.trim() ? { middle_name: form.middle_name.trim() } : {}),
        password: form.password,
      });
      sessionStorage.setItem(STORAGE_KEYS.PENDING_EMAIL, form.email);
      sessionStorage.setItem(STORAGE_KEYS.PENDING_FLOW, 'register');
      navigate(ROUTES.CONFIRM_CODE, { state: { email: form.email, flow: 'register' } });
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t('auth.register.title')}</h1>
        <p className="auth-subtitle">{t('auth.register.subtitle')}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="auth-error">{apiError}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">{t('auth.register.firstName')}</label>
              <input
                id="first_name"
                name="first_name"
                className={`form-input${errors.first_name ? ' form-input-error' : ''}`}
                type="text"
                placeholder={t('auth.register.firstNamePlaceholder')}
                value={form.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="given-name"
              />
              {errors.first_name && <span className="form-field-error">{t(errors.first_name)}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last_name">{t('auth.register.lastName')}</label>
              <input
                id="last_name"
                name="last_name"
                className={`form-input${errors.last_name ? ' form-input-error' : ''}`}
                type="text"
                placeholder={t('auth.register.lastNamePlaceholder')}
                value={form.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="family-name"
              />
              {errors.last_name && <span className="form-field-error">{t(errors.last_name)}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="middle_name">
              {t('auth.register.middleName')} <span className="optional">{t('auth.register.middleNameOptional')}</span>
            </label>
            <input
              id="middle_name"
              name="middle_name"
              className="form-input"
              type="text"
              placeholder={t('auth.register.middleNamePlaceholder')}
              value={form.middle_name}
              onChange={handleChange}
              autoComplete="additional-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">{t('auth.register.email')}</label>
            <input
              id="email"
              name="email"
              className={`form-input${errors.email ? ' form-input-error' : ''}`}
              type="email"
              placeholder={t('auth.register.emailPlaceholder')}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
            />
            {errors.email && <span className="form-field-error">{t(errors.email)}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">{t('auth.register.password')}</label>
            <input
              id="password"
              name="password"
              className={`form-input${errors.password ? ' form-input-error' : ''}`}
              type="password"
              placeholder={t('auth.register.passwordPlaceholder')}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
            />
            {errors.password && <span className="form-field-error">{t(errors.password)}</span>}
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <div className="auth-footer">
          {t('auth.register.hasAccount')} <Link to={ROUTES.LOGIN}>{t('auth.register.signIn')}</Link>
        </div>
      </div>
    </div>
  );
}
