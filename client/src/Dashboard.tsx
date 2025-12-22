import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import './Dashboard.css';

interface Ad {
  id: string;
  platform: string;
  product_description: string;
  headline?: string;
  copy?: string;
  title?: string;
  hook?: string;
  created_at: string;
  ai_model: string;
}

export default function Dashboard() {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdHistory();
    refreshUserProfile();
  }, []);

  async function fetchAdHistory() {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/user/ads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAds(data);
      }
    } catch (error) {
      console.error('Error fetching ad history:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!userProfile) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>👋 Welcome back{userProfile.display_name ? `, ${userProfile.display_name}` : ''}!</h1>
        <p>Manage your ads and subscription</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎨</div>
          <div className="stat-content">
            <div className="stat-label">Ads Remaining</div>
            <div className="stat-value">
              {userProfile.ads_remaining === 999999 ? '∞ Unlimited' : userProfile.ads_remaining}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Ads Created</div>
            <div className="stat-value">{userProfile.ads_generated_total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-label">Current Plan</div>
            <div className="stat-value capitalize">{userProfile.tier}</div>
          </div>
        </div>

        <div className="stat-card action-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-label">Need more ads?</div>
            <Link to="/pricing" className="upgrade-btn">
              {userProfile.tier === 'free' ? 'Upgrade Now' : 'View Plans'}
            </Link>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="account-section">
        <h2>Account Information</h2>
        <div className="account-card">
          <div className="account-item">
            <span className="label">Email:</span>
            <span className="value">{userProfile.email}</span>
          </div>
          <div className="account-item">
            <span className="label">Member since:</span>
            <span className="value">
              {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          {userProfile.subscription_status && (
            <div className="account-item">
              <span className="label">Subscription Status:</span>
              <span className="value capitalize">{userProfile.subscription_status}</span>
            </div>
          )}
        </div>
      </div>

      {/* Ad History */}
      <div className="history-section">
        <div className="section-header">
          <h2>Recent Ads</h2>
          {ads.length > 0 && (
            <span className="ad-count">{ads.length} total</span>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading ad history...</div>
        ) : ads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No ads yet</h3>
            <p>Create your first ad to see it here!</p>
            <Link to="/" className="create-ad-btn">
              Create Your First Ad
            </Link>
          </div>
        ) : (
          <div className="ads-grid">
            {ads.map((ad) => (
              <div key={ad.id} className="ad-history-card">
                <div className="ad-header">
                  <span className="ad-platform">{ad.platform}</span>
                  <span className="ad-date">
                    {new Date(ad.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="ad-content-preview">
                  <div className="ad-product">{ad.product_description}</div>

                  {ad.headline && (
                    <div className="ad-snippet">
                      <strong>Headline:</strong> {ad.headline}
                    </div>
                  )}

                  {ad.title && (
                    <div className="ad-snippet">
                      <strong>Title:</strong> {ad.title}
                    </div>
                  )}

                  {ad.hook && (
                    <div className="ad-snippet">
                      <strong>Hook:</strong> {ad.hook}
                    </div>
                  )}

                  {ad.copy && (
                    <div className="ad-snippet">
                      <strong>Copy:</strong> {ad.copy}
                    </div>
                  )}
                </div>

                <div className="ad-footer">
                  <span className="ai-badge">{ad.ai_model}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {userProfile.tier === 'free' && userProfile.ads_remaining <= 1 && (
        <div className="upgrade-prompt">
          <div className="prompt-content">
            <h3>🎉 You're almost out of free ads!</h3>
            <p>Upgrade to continue creating amazing ads</p>
            <Link to="/pricing" className="prompt-btn">
              View Pricing Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
