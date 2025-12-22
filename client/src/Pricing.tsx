import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import './Pricing.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

export default function Pricing() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(tier: string) {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setLoading(tier);
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  async function handleBuyAd(quantity: number = 1) {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      setLoading(`buy-${quantity}`);
      const token = await currentUser.getIdToken();

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      const { clientSecret } = await response.json();
      const stripe = await stripePromise;

      if (stripe && clientSecret) {
        // Redirect to Stripe checkout for one-time payment
        alert(`Payment setup complete! Amount: $${(quantity * 1.99).toFixed(2)}`);
        // In production, you'd use Stripe Elements for card input
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>🚀 Choose Your Plan</h1>
        <p>Start free, upgrade when you need more ads</p>

        {userProfile && (
          <div className="current-plan-badge">
            Current Plan: <strong>{userProfile.tier.toUpperCase()}</strong> |
            Ads Remaining: <strong>{userProfile.ads_remaining}</strong>
          </div>
        )}
      </div>

      {/* Pay-Per-Ad Option */}
      <div className="pay-per-ad-section">
        <div className="section-header">
          <h2>💰 Pay As You Go</h2>
          <p>Perfect for occasional use - no commitment required</p>
        </div>

        <div className="pay-per-ad-card">
          <div className="ppa-price">
            <span className="price-large">$1.99</span>
            <span className="price-unit">per ad</span>
          </div>

          <div className="ppa-features">
            <div className="feature">✅ All platforms (Instagram, YouTube, Amazon, etc.)</div>
            <div className="feature">✅ GPT-3.5 AI generation</div>
            <div className="feature">✅ No subscription, no expiry</div>
            <div className="feature">✅ Pay only when you need it</div>
          </div>

          <div className="ppa-buttons">
            <button
              className="buy-btn"
              onClick={() => handleBuyAd(1)}
              disabled={loading === 'buy-1'}
            >
              {loading === 'buy-1' ? '⏳ Processing...' : '🎨 Buy 1 Ad - $1.99'}
            </button>
            <button
              className="buy-btn secondary"
              onClick={() => handleBuyAd(5)}
              disabled={loading === 'buy-5'}
            >
              {loading === 'buy-5' ? '⏳ Processing...' : '📦 Buy 5 Ads - $9.95 (Save 10%)'}
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Subscriptions */}
      <div className="subscriptions-section">
        <div className="section-header">
          <h2>📅 Monthly Subscriptions</h2>
          <p>Best value for regular ad creation</p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="price-card free">
            <div className="card-badge">STARTER</div>
            <h3>Free</h3>
            <div className="price">
              <span className="amount">$0</span>
              <span className="period">/month</span>
            </div>

            <ul className="features">
              <li>✅ 3 ads per month</li>
              <li>✅ All 9 platforms</li>
              <li>✅ GPT-3.5 AI</li>
              <li>❌ No ad history</li>
              <li>❌ No priority support</li>
            </ul>

            <button
              className="subscribe-btn"
              onClick={() => navigate('/signup')}
              disabled={userProfile?.tier === 'free'}
            >
              {userProfile?.tier === 'free' ? '✓ Current Plan' : '🚀 Get Started'}
            </button>

            <div className="value-text">Perfect for testing</div>
          </div>

          {/* Starter Tier */}
          <div className="price-card starter">
            <div className="card-badge">POPULAR</div>
            <h3>Starter</h3>
            <div className="price">
              <span className="amount">$9</span>
              <span className="period">/month</span>
            </div>

            <div className="savings">$0.30 per ad (85% savings!)</div>

            <ul className="features">
              <li>✅ 30 ads per month</li>
              <li>✅ All 9 platforms</li>
              <li>✅ GPT-3.5 AI</li>
              <li>✅ Ad history & export</li>
              <li>✅ Email support</li>
            </ul>

            <button
              className="subscribe-btn primary"
              onClick={() => handleSubscribe('starter')}
              disabled={loading === 'starter' || userProfile?.tier === 'starter'}
            >
              {loading === 'starter' ? '⏳ Processing...' :
               userProfile?.tier === 'starter' ? '✓ Current Plan' : '💳 Subscribe'}
            </button>

            <div className="value-text">Best for small businesses</div>
          </div>

          {/* Pro Tier */}
          <div className="price-card pro">
            <div className="card-badge recommended">⭐ RECOMMENDED</div>
            <h3>Pro</h3>
            <div className="price">
              <span className="amount">$29</span>
              <span className="period">/month</span>
            </div>

            <div className="savings">Unlimited ads!</div>

            <ul className="features">
              <li>✅ <strong>Unlimited ads</strong></li>
              <li>✅ All 9 platforms</li>
              <li>✅ <strong>GPT-4 AI</strong> (better quality)</li>
              <li>✅ Ad history & export</li>
              <li>✅ Priority email support</li>
              <li>✅ A/B testing variations</li>
            </ul>

            <button
              className="subscribe-btn primary"
              onClick={() => handleSubscribe('pro')}
              disabled={loading === 'pro' || userProfile?.tier === 'pro'}
            >
              {loading === 'pro' ? '⏳ Processing...' :
               userProfile?.tier === 'pro' ? '✓ Current Plan' : '🚀 Upgrade to Pro'}
            </button>

            <div className="value-text">Best for agencies & power users</div>
          </div>

          {/* Business Tier */}
          <div className="price-card business">
            <div className="card-badge">ENTERPRISE</div>
            <h3>Business</h3>
            <div className="price">
              <span className="amount">$79</span>
              <span className="period">/month</span>
            </div>

            <div className="savings">Everything + Team features</div>

            <ul className="features">
              <li>✅ <strong>Everything in Pro</strong></li>
              <li>✅ Team collaboration (up to 5 users)</li>
              <li>✅ Shared ad library</li>
              <li>✅ Usage analytics</li>
              <li>✅ Priority support (24h response)</li>
              <li>✅ Custom brand voice training</li>
            </ul>

            <button
              className="subscribe-btn primary"
              onClick={() => handleSubscribe('business')}
              disabled={loading === 'business' || userProfile?.tier === 'business'}
            >
              {loading === 'business' ? '⏳ Processing...' :
               userProfile?.tier === 'business' ? '✓ Current Plan' : '💼 Get Business'}
            </button>

            <div className="value-text">Perfect for marketing teams</div>
          </div>
        </div>
      </div>

      {/* Platform Coverage */}
      <div className="platform-coverage">
        <h3>🌐 All Plans Include:</h3>
        <div className="platform-grid">
          <div className="platform-item">📱 Instagram & Pinterest</div>
          <div className="platform-item">🎬 YouTube</div>
          <div className="platform-item">📦 Amazon</div>
          <div className="platform-item">👤 Facebook</div>
          <div className="platform-item">🔍 Google Ads</div>
          <div className="platform-item">💼 LinkedIn</div>
          <div className="platform-item">🐦 Twitter/X</div>
          <div className="platform-item">🎵 TikTok</div>
          <div className="platform-item">🌟 General</div>
        </div>
      </div>

      {/* FAQ or Trust Badges */}
      <div className="pricing-footer">
        <p>✅ Cancel anytime • ✅ Secure payment via Stripe • ✅ 30-day money-back guarantee</p>
      </div>
    </div>
  );
}
