import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import './Auth.css';

export default function VerifyEmail() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already verified or not logged in, redirect
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.emailVerified) {
      navigate('/dashboard');
      return;
    }

    // Check email verification status periodically
    const interval = setInterval(async () => {
      await currentUser.reload();
      if (currentUser.emailVerified) {
        navigate('/dashboard');
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleResendEmail() {
    if (!currentUser || countdown > 0) return;

    try {
      setError('');
      setLoading(true);
      await sendEmailVerification(currentUser);
      setSuccess(true);
      setCountdown(60); // 60 second cooldown
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  }

  async function handleSkip() {
    navigate('/dashboard');
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>🎨 AdCreatorPro</h1>
          <h2>Verify Your Email</h2>
          <p>We've sent a verification link to your email</p>
        </div>

        <div className="verify-email-content">
          <div className="email-icon" style={{ fontSize: '4rem', textAlign: 'center', margin: '1rem 0' }}>
            📧
          </div>

          <div className="info-box" style={{
            background: '#f0f7ff',
            border: '1px solid #b3d9ff',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, color: '#1a1a1a' }}>
              <strong>Email sent to:</strong> {currentUser.email}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>What's next?</h3>
            <ol style={{ paddingLeft: '1.5rem', textAlign: 'left' }}>
              <li>Check your inbox for an email from AdCreatorPro</li>
              <li>Click the verification link in the email</li>
              <li>This page will automatically refresh once verified</li>
            </ol>
          </div>

          {error && (
            <div className="error-message" style={{ marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{
              background: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem',
              color: '#22543d'
            }}>
              ✅ Verification email sent! Check your inbox.
            </div>
          )}

          <button
            onClick={handleResendEmail}
            className="auth-btn primary"
            disabled={loading || countdown > 0}
            style={{ marginBottom: '1rem', width: '100%' }}
          >
            {loading ? '🔄 Sending...' : countdown > 0 ? `⏱️ Resend in ${countdown}s` : '📧 Resend Verification Email'}
          </button>

          <button
            onClick={handleSkip}
            className="auth-btn"
            style={{ marginBottom: '1rem', width: '100%', background: '#f7f7f7', color: '#666' }}
          >
            Skip for Now
          </button>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', borderRadius: '8px', border: '1px solid #ffd666' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#7c3aed' }}>
              💡 <strong>Tip:</strong> Check your spam folder if you don't see the email.
              The verification link expires in 1 hour.
            </p>
          </div>

          <div className="auth-footer" style={{ marginTop: '2rem' }}>
            <p>
              Wrong email address?{' '}
              <button
                onClick={handleLogout}
                className="auth-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign out and try again
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
