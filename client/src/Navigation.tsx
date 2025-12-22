import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Navigation.css';

export default function Navigation() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="brand-icon">🎨</span>
          <span className="brand-name">AdCreatorPro</span>
        </Link>

        <div className="nav-menu">
          <Link to="/" className="nav-link">Generate Ad</Link>
          <Link to="/pricing" className="nav-link">Pricing</Link>

          {currentUser ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/brand-profiles" className="nav-link">Brand Profiles</Link>

              {userProfile && (
                <div className="nav-credits">
                  <span className="credits-badge">
                    {userProfile.ads_remaining === 999999 ? '∞' : userProfile.ads_remaining} ads
                  </span>
                  <span className="tier-badge">{userProfile.tier}</span>
                </div>
              )}

              <button onClick={handleLogout} className="nav-btn logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn secondary">
                Login
              </Link>
              <Link to="/signup" className="nav-btn primary">
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
