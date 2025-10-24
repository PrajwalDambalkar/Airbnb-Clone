import './SignIn.css';

export default function SignIn() {
  return (
    <div className="signin-page">
      <header className="site-header">
        <a href="/" className="site-logo-link" aria-label="Home">
          <img src="/photos/Airbnb-Logo.wine.png" alt="logo" className="site-logo" />
        </a>
      </header>

      <main className="signin-wrapper">
        <div className="signin-card">
          <div className="card-title">Welcome to Airbnb</div>

          <div className="phone-group">
            <label className="label">Country code</label>
            <select className="country-select">
              <option>United States (+1)</option>
              <option>United Kingdom (+44)</option>
              <option>Canada (+1)</option>
            </select>

            <input className="phone-input" placeholder="Phone number" />
            <p className="small-muted">
              We'll call or text you to confirm your number. Standard message and data rates apply.
              <a href="#" className="privacy"> Privacy Policy</a>
            </p>

            <button className="primary-btn">Continue</button>
          </div>

          <div className="or-sep"><span>or</span></div>

          <div className="social-list">
            <a href="/auth/google" className="social-btn" aria-label="Continue with Google">
              <img src="/icons/google.png" alt="Google" className="social-icon" />
              <span className="social-text">Continue with Google</span>
            </a>

            <a href="/auth/apple" className="social-btn" aria-label="Continue with Apple">
              <img src="/icons/apple.png" alt="Apple" className="social-icon" />
              <span className="social-text">Continue with Apple</span>
            </a>

            <a href="/auth/email" className="social-btn" aria-label="Continue with email">
              <img src="/icons/email.svg" alt="Email" className="social-icon" />
              <span className="social-text">Continue with email</span>
            </a>

            <a href="/auth/facebook" className="social-btn" aria-label="Continue with Facebook">
              <img src="/icons/facebook.svg" alt="Facebook" className="social-icon" />
              <span className="social-text">Continue with Facebook</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
