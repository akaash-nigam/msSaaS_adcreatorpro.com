import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const session_id = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/dashboard';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="payment-result-page">
      <div className="result-container success">
        <div className="result-icon success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p className="result-message">
          Thank you for your purchase. Your account has been updated with your new credits or subscription.
        </p>

        {session_id && (
          <p className="session-id">
            <small>Transaction ID: {session_id.substring(0, 20)}...</small>
          </p>
        )}

        <div className="result-actions">
          <Link to="/dashboard" className="primary-btn">
            Go to Dashboard
          </Link>
          <Link to="/" className="secondary-btn">
            Create Your First Ad
          </Link>
        </div>

        <p className="redirect-notice">
          Redirecting to dashboard in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}
