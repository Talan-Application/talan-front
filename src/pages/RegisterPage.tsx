import { useState, type FormEvent, type ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { getApiErrorMessage } from '../utils/error';
import './auth.css';

interface FormState {
  email: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  password: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    email: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register({
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        ...(form.middle_name.trim() ? { middle_name: form.middle_name.trim() } : {}),
        password: form.password,
      });
      sessionStorage.setItem('talan_pending_email', form.email);
      sessionStorage.setItem('talan_pending_flow', 'register');
      navigate('/confirm-code', { state: { email: form.email, flow: 'register' } });
    } catch (err) {
      setError(getApiErrorMessage(err));
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
          {error && <div className="auth-error">{error}</div>}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="first_name">First name</label>
              <input
                id="first_name"
                name="first_name"
                className="form-input"
                type="text"
                placeholder="John"
                value={form.first_name}
                onChange={handleChange}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                name="last_name"
                className="form-input"
                type="text"
                placeholder="Doe"
                value={form.last_name}
                onChange={handleChange}
                required
                autoComplete="family-name"
              />
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
              className="form-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
