import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Navigation.css';

export default function Navigation() {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand" onClick={closeMobileMenu}>
          <span className="brand-icon">🎨</span>
          <span className="brand-name">AdCreatorPro</span>
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-menu ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMobileMenu}>Generate Ad</Link>
          <Link to="/pricing" className="nav-link" onClick={closeMobileMenu}>Pricing</Link>

          {currentUser ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={closeMobileMenu}>Dashboard</Link>
              <Link to="/brand-profiles" className="nav-link" onClick={closeMobileMenu}>Brand Profiles</Link>

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
              <Link to="/login" className="nav-btn secondary" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/signup" className="nav-btn primary" onClick={closeMobileMenu}>
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
