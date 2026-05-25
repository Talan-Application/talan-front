import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { ROUTES } from '../../../constants';
import '../../home.css';

export function StaffHomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">
          Welcome back{user ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="home-subtitle">
          Manage your quizzes, courses, and learning content all in one place.
        </p>
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
          <p className="home-stat-label">Quizzes</p>
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
          <p className="home-stat-label">Common Subjects</p>
        </div>
      </div>
    </div>
  );
}
