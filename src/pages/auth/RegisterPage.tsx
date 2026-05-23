import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    if (!value.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email.';
  }
  if (name === 'first_name' && !value.trim()) return 'First name is required.';
  if (name === 'last_name' && !value.trim()) return 'Last name is required.';
  if (name === 'password') {
    if (!value) return 'Password is required.';
    if (value.length < 6) return 'Password must be at least 6 characters.';
  }
  return '';
}

export function RegisterPage() {
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
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Fill in your details to get started</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {apiError && <div className="auth-error">{apiError}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">First name</label>
              <input
                id="first_name"
                name="first_name"
                className={`form-input${errors.first_name ? ' form-input-error' : ''}`}
                type="text"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="given-name"
              />
              {errors.first_name && <span className="form-field-error">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                name="last_name"
                className={`form-input${errors.last_name ? ' form-input-error' : ''}`}
                type="text"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="family-name"
              />
              {errors.last_name && <span className="form-field-error">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="middle_name">
              Middle name <span className="optional">(optional)</span>
            </label>
            <input
              id="middle_name"
              name="middle_name"
              className="form-input"
              type="text"
              placeholder="Smith"
              value={form.middle_name}
              onChange={handleChange}
              autoComplete="additional-name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className={`form-input${errors.email ? ' form-input-error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
            />
            {errors.email && <span className="form-field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              className={`form-input${errors.password ? ' form-input-error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
            />
            {errors.password && <span className="form-field-error">{errors.password}</span>}
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
