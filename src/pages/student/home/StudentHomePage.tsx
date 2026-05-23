import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { ROUTES } from '../../../constants';
import '../../home.css';

export function StudentHomePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">
          Welcome back{user ? `, ${user.first_name}` : ''}!
        </h1>
        <p className="home-subtitle">
          Browse available quizzes and track your learning progress.
        </p>
      </div>

      <div className="home-cards">
        <div
          className="home-stat-card"
          role="button"
          tabIndex={0}
          onClick={() => navigate(ROUTES.STUDENT_QUIZZES)}
          onKeyDown={e => e.key === 'Enter' && navigate(ROUTES.STUDENT_QUIZZES)}
          style={{ cursor: 'pointer' }}
        >
          <span className="home-stat-icon">📝</span>
          <p className="home-stat-label">My Quizzes</p>
        </div>
      </div>
    </div>
  );
}
