import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { authApi } from '../api';
import { ROUTES } from '../constants';
import { LANGUAGES, setLanguage, type LangCode } from '../i18n';
import './header.css';

export function Header() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const staffNav = [
    { to: ROUTES.HOME, label: t('nav.home') },
    { to: ROUTES.QUIZZES, label: t('nav.quizzes') },
    { to: ROUTES.COMMON_SUBJECTS, label: t('nav.commonSubjects') },
  ];

  const studentNav = [
    { to: ROUTES.HOME, label: t('nav.home') },
    { to: ROUTES.STUDENT_QUIZZES, label: t('nav.myQuizzes') },
  ];

  const navLinks = user?.role === 'student' ? studentNav : staffNav;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    try {
      await authApi.logout();
    } catch {
      // proceed with local logout regardless of server response
    }
    logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <header className="header">
      <div className="header-logo">
        <img src="/favicon.svg" alt="Logo" className="header-logo-img" />
        <span className="header-logo-text">Talan</span>
      </div>

      <nav className="header-nav">
        {navLinks.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.HOME}
            className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="header-actions">
        <div className="header-lang-switcher">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              className={`header-lang-btn${i18n.language === code ? ' active' : ''}`}
              onClick={() => setLanguage(code as LangCode)}
            >
              {label}
            </button>
          ))}
        </div>

        {isAuthenticated && (
          <div className="header-profile-wrapper" ref={dropdownRef}>
            <button
              className="header-profile-btn"
              onClick={() => setDropdownOpen(prev => !prev)}
            >
              <div className="header-avatar">
                {user ? user.first_name[0].toUpperCase() : '?'}
              </div>
              <span className="header-profile-name">
                {user ? `${user.first_name} ${user.last_name}` : ''}
              </span>
              <svg
                className={`header-chevron${dropdownOpen ? ' open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="header-dropdown">
                <button className="header-dropdown-item" onClick={handleLogout}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t('nav.signOut')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
