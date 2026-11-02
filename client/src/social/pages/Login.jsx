import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginWithGoogle, hasGoogleAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleLogin = async () => {
    if (!hasGoogleAuth) {
      toast.error('Firebase is not configured! Please add your VITE_FIREBASE_* keys to client/.env');
      return;
    }
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Google Login failed');
    }
  };

  return (
    <div className="auth-split-container">
      {/* Animated Background Blobs */}
      <div className="auth-bg-blobs">
        <div className="auth-blob auth-blob-1"></div>
        <div className="auth-blob auth-blob-2"></div>
        <div className="auth-blob auth-blob-3"></div>
      </div>

      {/* Left panel: Visual Showcase */}
      <div className="auth-showcase-panel">
        <div className="showcase-brand">
          <img src={logo} alt="Mediamation Logo" className="showcase-logo-img" />
          <div className="showcase-brand-details">
            <span className="showcase-app-name">Mediamation</span>
            <span className="showcase-company-name">by Tarasaka Digital Solutions</span>
          </div>
        </div>

        <div className="showcase-visual">
          <div className="visual-canvas">
            {/* Mock Scheduler Queue Card */}
            <div className="mock-scheduler-card">
              <div className="scheduler-header">
                <div className="scheduler-title">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                  </svg>
                  Queue Calendar
                </div>
                <div className="scheduler-dots">
                  <div className="scheduler-dot red"></div>
                  <div className="scheduler-dot yellow"></div>
                  <div className="scheduler-dot green"></div>
                </div>
              </div>
              
              <div className="scheduler-queue">
                <div className="queue-item">
                  <div className="queue-meta">
                    <div className="queue-icon-badge ig">IG</div>
                    <div className="queue-details">
                      <span className="queue-text">Summer Product Showcase Reel</span>
                      <span className="queue-time">Today, 5:30 PM</span>
                    </div>
                  </div>
                  <span className="queue-status scheduled">Scheduled</span>
                </div>
                
                <div className="queue-item">
                  <div className="queue-meta">
                    <div className="queue-icon-badge tw">X</div>
                    <div className="queue-details">
                      <span className="queue-text">Mediamation Beta Announcement</span>
                      <span className="queue-time">Today, 2:15 PM</span>
                    </div>
                  </div>
                  <span className="queue-status published">Published</span>
                </div>
              </div>
            </div>

            {/* Floating Analytics Badges */}
            <div className="floating-overlay-card overlay-analytics">
              <div className="analytics-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                </svg>
              </div>
              <div className="analytics-info">
                <span className="analytics-num">+142%</span>
                <span className="analytics-label">Follower Growth</span>
              </div>
            </div>

            <div className="floating-overlay-card overlay-engagement">
              <div className="analytics-icon-wrapper" style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" />
                </svg>
              </div>
              <div className="analytics-info">
                <span className="analytics-num">9.8k</span>
                <span className="analytics-label">Interactions</span>
              </div>
            </div>
          </div>
        </div>

        <div className="showcase-footer">
          <h2 className="showcase-tagline">
            Schedule. Analyze. <span>Automate.</span>
          </h2>
          <p className="showcase-subtext">
            Elevate your digital footprint. Create, organize, and auto-publish content across all your social networks with AI-powered engagement analytics.
          </p>
        </div>
      </div>

      {/* Right panel: Authentication Form */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Header visible ONLY on mobile/tablet screens when showcase collapses */}
          <div className="auth-form-header">
            <img src={logo} alt="Mediamation Logo" className="auth-form-logo" />
            <div className="auth-form-title-wrap">
              <h2>Mediamation</h2>
              <p>Powered by Tarasaka Digital Solutions</p>
            </div>
          </div>

          <div className="auth-brand">
            <h1>Welcome Back</h1>
            <p className="auth-powered-by">Powered by Tarasaka Digital Solutions</p>
          </div>
          <p className="subtitle">Social Media Scheduler</p>
          <form onSubmit={handleSubmit}>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Log In</button>
          </form>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <button type="button" className="btn-google" onClick={handleGoogleLogin}>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.13h4.01c2.34-2.16 3.69-5.35 3.69-8.75z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.13c-1.12.75-2.55 1.19-3.95 1.19-3.04 0-5.61-2.05-6.53-4.82H1.31v3.23A12 12 0 0 0 12 24z"/>
              <path fill="#FBBC05" d="M5.47 14.33A7.17 7.17 0 0 1 5.07 12c0-.82.14-1.61.4-2.33V6.44H1.31A11.97 11.97 0 0 0 0 12c0 2.12.55 4.12 1.52 5.89l3.95-3.56z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.96 1.19 15.24 0 12 0A12 12 0 0 0 1.31 6.44l4.16 3.23c.92-2.77 3.49-4.82 6.53-4.82z"/>
            </svg>
            Sign In with Google
          </button>

          <p className="auth-link">Don't have an account? <Link to="/register">Register</Link></p>
        </div>
      </div>
    </div>
  );
}

