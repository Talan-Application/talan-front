import { useAuthStore } from '../stores/authStore';
import './home.css';

export function HomePage() {
  const { user } = useAuthStore();

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
        <div className="home-stat-card">
          <span className="home-stat-icon">📝</span>
          <p className="home-stat-label">Quizzes</p>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-icon">📚</span>
          <p className="home-stat-label">Courses</p>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-icon">🎓</span>
          <p className="home-stat-label">Subjects</p>
        </div>
        <div className="home-stat-card">
          <span className="home-stat-icon">👥</span>
          <p className="home-stat-label">Users</p>
        </div>
      </div>
    </div>
  );
}
