import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import './Auth.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setError('');
      setSuccess(false);
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>🎨 AdCreatorPro</h1>
          <h2>Reset Your Password</h2>
          <p>We'll send you a link to reset your password</p>
        </div>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div className="success-message">
            <div className="success-icon">✅</div>
            <h3>Check Your Email!</h3>
            <p>
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p>
              Click the link in the email to create a new password.
              The link will expire in 1 hour.
            </p>
            <div className="auth-footer" style={{ marginTop: '2rem' }}>
              <p>
                Didn't receive the email?{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="auth-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Try again
                </button>
              </p>
              <p>
                <Link to="/login" className="auth-link">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="auth-btn primary"
                disabled={loading}
              >
                {loading ? '🔄 Sending...' : '📧 Send Reset Link'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
              <p>
                Don't have an account?{' '}
                <Link to="/signup" className="auth-link">
                  Sign up
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
