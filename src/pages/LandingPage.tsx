import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { ROUTES } from '../constants';
import './landing.css';

function QuizIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RolesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 7c1.657 0 3 1.343 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 17c0-2.209-1.343-4-3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 15l4-5 4 3 4-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 18h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LandingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.HOME, { replace: true });
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page">
      <header className="landing-header">
        <span className="landing-logo">Talan</span>
        <nav className="landing-nav">
          <Link to={ROUTES.LOGIN} className="landing-nav-link">{t('landing.hero.login')}</Link>
          <Link to={ROUTES.REGISTER} className="landing-btn-outline">{t('landing.hero.register')}</Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-badge">{t('landing.badge')}</div>
            <h1 className="landing-headline">{t('landing.hero.headline')}</h1>
            <p className="landing-subheadline">{t('landing.hero.subtitle')}</p>
            <div className="landing-cta">
              <Link to={ROUTES.LOGIN} className="landing-btn-primary">{t('landing.hero.login')}</Link>
              <Link to={ROUTES.REGISTER} className="landing-btn-secondary">{t('landing.hero.register')}</Link>
            </div>
          </div>
        </section>

        <section className="landing-features">
          <h2 className="landing-features-title">{t('landing.features.title')}</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><QuizIcon /></div>
              <h3 className="landing-feature-name">{t('landing.features.quiz.title')}</h3>
              <p className="landing-feature-desc">{t('landing.features.quiz.desc')}</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><RolesIcon /></div>
              <h3 className="landing-feature-name">{t('landing.features.roles.title')}</h3>
              <p className="landing-feature-desc">{t('landing.features.roles.desc')}</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon"><ProgressIcon /></div>
              <h3 className="landing-feature-name">{t('landing.features.progress.title')}</h3>
              <p className="landing-feature-desc">{t('landing.features.progress.desc')}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>{t('landing.footer')}</p>
      </footer>
    </div>
  );
}
