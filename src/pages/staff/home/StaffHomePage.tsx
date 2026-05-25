import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/authStore';
import { ROUTES } from '../../../constants';
import '../../home.css';

export function StaffHomePage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">
          {t('home.welcomeBack', { name: user ? `, ${user.first_name}` : '' })}
        </h1>
        <p className="home-subtitle">{t('home.staff.subtitle')}</p>
      </div>

      <div className="home-cards">
        <div
          className="home-stat-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.QUIZZES)}
          onKeyDown={e => e.key === 'Enter' && navigate(ROUTES.QUIZZES)}
          style={{ cursor: 'pointer' }}
        >
          <span className="home-stat-icon">📝</span>
          <p className="home-stat-label">{t('home.staff.quizzes')}</p>
        </div>
        <div
          className="home-stat-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.COMMON_SUBJECTS)}
          onKeyDown={e => e.key === 'Enter' && navigate(ROUTES.COMMON_SUBJECTS)}
          style={{ cursor: 'pointer' }}
        >
          <span className="home-stat-icon">🎓</span>
          <p className="home-stat-label">{t('home.staff.commonSubjects')}</p>
        </div>
      </div>
    </div>
  );
}
