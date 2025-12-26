import { Link } from 'react-router-dom';
import './PaymentSuccess.css';

export default function PaymentCancel() {
  return (
    <div className="payment-result-page">
      <div className="result-container cancel">
        <div className="result-icon cancel-icon">!</div>
        <h1>Payment Canceled</h1>
        <p className="result-message">
          Your payment was canceled. No charges were made to your account.
        </p>

        <div className="reasons-list">
          <h3>Common reasons for canceling:</h3>
          <ul>
            <li>Not ready to purchase yet</li>
            <li>Need to review pricing options</li>
            <li>Have questions about the service</li>
            <li>Prefer to test the free tier first</li>
          </ul>
        </div>

        <div className="result-actions">
          <Link to="/pricing" className="primary-btn">
            View Pricing Again
          </Link>
          <Link to="/" className="secondary-btn">
            Try Free Tier
          </Link>
        </div>

        <p className="redirect-notice">
          Need help? <a href="mailto:support@adcreatorpro.com" style={{color: '#667eea'}}>Contact our support team</a>
        </p>
      </div>
    </div>
  );
}
