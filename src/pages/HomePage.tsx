import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import './home.css';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // proceed with local logout regardless of server response
    }
    logout();
    navigate('/login', { replace: true });
  }

  const displayName = user
    ? `${user.first_name} ${user.last_name}`
    : 'there';

  return (
    <div className="home-page">
      <div className="home-card">
        <h1 className="home-title">Welcome, {displayName}!</h1>
        <p className="home-subtitle">You are successfully authenticated.</p>
        {user && (
          <p className="home-email">{user.email}</p>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
