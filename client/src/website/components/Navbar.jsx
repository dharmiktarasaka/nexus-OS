import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';
import {
  Sparkles,
  Plus,
  LayoutGrid,
  Settings,
  LogOut,
  ShieldCheck,
  Sun,
  Moon,
  ArrowLeft
} from 'lucide-react';

function UserAvatar({ user }) {
  const [imgError, setImgError] = useState(false);

  // Compute initials from displayName or email
  const name = user?.displayName || user?.email || 'User';

  const getInitials = (str) => {
    if (!str) return 'U';
    const clean = str.replace(/@.*/, '').trim();
    const parts = clean.split(/[\s._-]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  // Deterministic vibrant gradient based on user name
  const getGradient = (str) => {
    const gradients = [
      'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      'linear-gradient(135deg, #059669 0%, #0284c7 100%)',
      'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
      'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const hasPhoto = Boolean(
    user?.photoURL &&
    typeof user.photoURL === 'string' &&
    user.photoURL.trim().length > 10 &&
    !user.photoURL.includes('undefined') &&
    !user.photoURL.includes('null')
  );

  if (hasPhoto && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt=""
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className="avatar-initials-fallback"
      style={{
        background: getGradient(name)
      }}
    >
      {initials}
    </span>
  );
}

export default function Navbar() {
  const { user, logout, isRealFirebase } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('studio_theme') || 'light');
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/apps/website-builder') ? '/apps/website-builder' : '';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('studio_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="app-navbar">
        <div className="nav-left">
          <Link to="/" className="nav-item return-os-btn" title="Back to All-in-One Business OS">
            <ArrowLeft size={16} />
            <span>Central OS</span>
          </Link>

          <Link to={`${basePath}`} className="app-logo">
            <div className="logo-icon-box">
              <Sparkles size={20} />
            </div>
            <span className="logo-title">
              Pulse<strong>Studio</strong> <span className="version-pill">AI</span>
            </span>
          </Link>

          <nav className="nav-menu">
            <Link to={`${basePath}`} className="nav-item">
              <LayoutGrid size={16} />
              <span>Projects</span>
            </Link>
          </nav>
        </div>

        <div className="nav-right">
          <Link to={`${basePath}/new`} className="btn-create-nav">
            <Plus size={16} />
            <span>Generate Website</span>
          </Link>

          <button
            className="icon-action-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          <button
            className="icon-action-btn"
            onClick={() => setShowSettings(true)}
            title="Studio Settings & Keys"
          >
            <Settings size={18} />
          </button>

          {user && (
            <div className="user-profile-badge">
              <div className="user-avatar-circle" title={user.email}>
                <UserAvatar user={user} />
              </div>
              <div className="user-text-info">
                <span className="user-name-label">{user.displayName || user.email?.split('@')[0]}</span>
                <span className="auth-type-pill">
                  {isRealFirebase ? <ShieldCheck size={10} /> : null}
                  {isRealFirebase ? 'Firebase' : 'Guest'}
                </span>
              </div>
              <button className="icon-logout-btn" onClick={handleLogout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
