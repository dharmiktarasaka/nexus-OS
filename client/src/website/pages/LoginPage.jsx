import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatFirebaseAuthError, DEFAULT_FIREBASE_CONFIG } from '../firebase';
import { Sparkles, Shield, UserCheck, ArrowRight, Lock, Mail, AlertCircle, User, Database } from 'lucide-react';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, loginAsGuest, isRealFirebase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Auth error:', err);
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginAsGuest();
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      setError(formatFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-backdrop-glow"></div>

      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-logo-symbol">
            <Sparkles size={24} />
          </div>
          <h1 className="login-title">PulseStudio AI</h1>
          <p className="login-subtitle">Autonomous Generative Web Design & Engineering Studio</p>
          <div className="firebase-status-badge">
            <Database size={13} className="text-emerald" />
            <span>Storage: <strong>MongoDB Cloud / Local</strong> (DB: pulse_studio)</span>
          </div>
        </div>

        {/* 1-Click QA / Reviewer Access */}
        <div className="qa-access-box">
          <div className="qa-access-info">
            <span className="qa-tag">Senior QA & Reviewer Fast Track</span>
            <p className="qa-text">Instant 1-click access to test generation, live studio preview, and ZIP export without external credentials.</p>
          </div>
          <button className="btn-qa-login" onClick={handleGuestLogin} disabled={loading}>
            <UserCheck size={18} />
            <span>1-Click QA Director Sign In</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="login-divider">
          <span>Or authenticate via MongoDB & Secure JWT</span>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Email / Password Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label className="input-label">Full Name / Display Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Alex Rivera"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="input-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                className="form-input"
                placeholder="director@studio.design"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="input-with-icon">
              <Lock size={16} className="input-icon" />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading ? (
              <span className="spinner-sm"></span>
            ) : (
              <span>{isSignUp ? 'Create Studio Account' : 'Sign In to Workspace'}</span>
            )}
          </button>
        </form>

        <div className="auth-footer-actions">
          <button
            type="button"
            className="btn-toggle-mode"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>

          <button
            type="button"
            className="btn-google-auth"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="login-security-tag">
          <Shield size={12} />
          <span>Protected routes with persistent token session</span>
        </div>
      </div>
    </div>
  );
}
