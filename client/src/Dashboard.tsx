import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from './components/Toast';
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
  const toast = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // Filtering and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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

  // Get filtered and sorted ads
  const getFilteredAds = () => {
    let filtered = [...ads];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad =>
        ad.product_description?.toLowerCase().includes(query) ||
        ad.headline?.toLowerCase().includes(query) ||
        ad.copy?.toLowerCase().includes(query) ||
        ad.title?.toLowerCase().includes(query) ||
        ad.hook?.toLowerCase().includes(query)
      );
    }

    // Platform filter
    if (platformFilter !== 'All') {
      filtered = filtered.filter(ad => ad.platform === platformFilter);
    }

    // Date filter
    if (dateFilter !== 'All') {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === 'Last 7 days') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === 'Last 30 days') {
        filterDate.setDate(now.getDate() - 30);
      }

      filtered = filtered.filter(ad => new Date(ad.created_at) >= filterDate);
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };

  const filteredAds = getFilteredAds();
  const uniquePlatforms = ['All', ...Array.from(new Set(ads.map(ad => ad.platform)))];

  async function handleManageSubscription() {
    if (!currentUser) return;

    try {
      setPortalLoading(true);
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe customer portal
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to open subscription management portal');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error('Failed to open subscription management portal. Please try again.');
    } finally {
      setPortalLoading(false);
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
        <div className="section-header-with-action">
          <h2>Account Information</h2>
          {userProfile.tier !== 'free' && userProfile.stripe_customer_id && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="manage-subscription-btn"
            >
              {portalLoading ? '⏳ Loading...' : '⚙️ Manage Subscription'}
            </button>
          )}
        </div>
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
              <span className="value capitalize status-badge status-{userProfile.subscription_status}">
                {userProfile.subscription_status}
              </span>
            </div>
          )}
          {userProfile.tier !== 'free' && (
            <div className="subscription-info">
              <p className="info-text">
                💡 Use "Manage Subscription" to update your payment method, view invoices, or cancel your subscription.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ad History */}
      <div className="history-section">
        <div className="section-header">
          <h2>Recent Ads</h2>
          {ads.length > 0 && (
            <span className="ad-count">{filteredAds.length} of {ads.length} ads</span>
          )}
        </div>

        {/* Filter Controls */}
        {ads.length > 0 && (
          <div className="filter-controls" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            background: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <div className="filter-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', display: 'block' }}>
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Search ads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e0'}
              />
            </div>

            <div className="filter-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', display: 'block' }}>
                📱 Platform
              </label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {uniquePlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', display: 'block' }}>
                📅 Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Time</option>
                <option value="Last 7 days">Last 7 days</option>
                <option value="Last 30 days">Last 30 days</option>
              </select>
            </div>

            <div className="filter-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#4a5568', marginBottom: '6px', display: 'block' }}>
                🔄 Sort By
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        )}

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
        ) : filteredAds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No ads match your filters</h3>
            <p>Try adjusting your search or filter criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setPlatformFilter('All');
                setDateFilter('All');
              }}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="ads-grid">
            {filteredAds.map((ad) => (
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
