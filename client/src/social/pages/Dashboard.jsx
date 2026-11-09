import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { accountsAPI } from '../api/index.js';
import { signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { auth, facebookProvider } from '../config/firebase.js';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PLATFORM_CONFIG = {
  pinterest: {
    name: 'Pinterest',
    color: '#bd081c',
    icon: '📌',
    defaultHandle: '@NexusPins',
    callbackPath: '/api/accounts/pinterest/callback',
    docs: 'https://developers.pinterest.com/apps/',
    authFunc: accountsAPI.pinterestAuth,
  },
  tumblr: {
    name: 'Tumblr',
    color: '#35465c',
    icon: '📝',
    defaultHandle: 'nexus-corp-blog',
    callbackPath: '/api/accounts/tumblr/callback',
    docs: 'https://www.tumblr.com/oauth/apps',
    authFunc: accountsAPI.tumblrAuth,
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0a66c2',
    icon: '💼',
    defaultHandle: '@NexusProfessional',
    callbackPath: '/api/accounts/linkedin/callback',
    docs: 'https://www.linkedin.com/developers/apps/77rq0wbfvmxy4u/auth',
    authFunc: accountsAPI.linkedinAuth,
  },
  facebook: {
    name: 'Facebook',
    color: '#1877f2',
    icon: '👥',
    defaultHandle: 'Nexus Business HQ',
    callbackPath: '/api/accounts/facebook/callback',
    docs: 'https://developers.facebook.com/apps/',
    authFunc: accountsAPI.facebookAuth,
  },
  instagram: {
    name: 'Instagram',
    color: '#e1306c',
    icon: '📸',
    defaultHandle: '@NexusOfficial',
    callbackPath: '/api/accounts/instagram/callback',
    docs: 'https://developers.facebook.com/',
    authFunc: accountsAPI.instagramAuth,
  }
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { accounts, posts, refreshAccounts, setAccounts } = useData();
  const [searchParams] = useSearchParams();
  const [showInstaHelp, setShowInstaHelp] = useState(false);
  
  // Platform Connection Modal State
  const [connectModalPlatform, setConnectModalPlatform] = useState(null);
  const [customHandle, setCustomHandle] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [customRedirectUri, setCustomRedirectUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState('oauth'); // 'oauth' | 'token' | 'demo' | 'credentials'
  const [copiedUri, setCopiedUri] = useState(false);

  // Instagram credentials flow
  const [instaUsername, setInstaUsername] = useState('');
  const [instaPassword, setInstaPassword] = useState('');
  const [instaCode, setInstaCode] = useState('');
  const [instaStep, setInstaStep] = useState(1);
  const [connectingInsta, setConnectingInsta] = useState(false);

  // Upcoming posts = scheduled ones from the cache
  const upcomingPosts = posts.filter(p => p.status === 'scheduled');

  useEffect(() => {
    if (searchParams.get('connected') === 'facebook') {
      toast.success('Facebook account connected successfully!');
      refreshAccounts();
    } else if (searchParams.get('error') === 'facebook_auth_failed') {
      toast.error('Failed to connect Facebook account.');
    } else if (searchParams.get('error') === 'no_pages_found') {
      toast.error('Connected successfully, but no Facebook Pages were found. Make sure you own/manage a Page and selected it during login.');
    } else if (searchParams.get('connected') === 'instagram') {
      toast.success('Instagram account connected successfully!');
      refreshAccounts();
    } else if (searchParams.get('error') === 'instagram_auth_failed') {
      toast.error('Failed to connect Instagram account.');
    } else if (searchParams.get('connected') === 'pinterest') {
      toast.success('Pinterest account connected successfully!');
      refreshAccounts();
    } else if (searchParams.get('error') === 'pinterest_auth_failed') {
      toast.error('Failed to connect Pinterest account.');
    } else if (searchParams.get('connected') === 'tumblr') {
      toast.success('Tumblr account connected successfully!');
      refreshAccounts();
      accountsAPI.list().then(res => {
        if (res.data) setAccounts(res.data);
      }).catch(() => {});
    } else if (searchParams.get('error') === 'tumblr_auth_failed') {
      const details = searchParams.get('details');
      toast.error(details ? `Failed to connect Tumblr: ${details}` : 'Failed to connect Tumblr account.');
    } else if (searchParams.get('connected') === 'linkedin') {
      toast.success('LinkedIn account connected successfully!');
      refreshAccounts();
    } else if (searchParams.get('error') === 'linkedin_auth_failed') {
      const details = searchParams.get('details');
      toast.error(details ? `Failed to connect LinkedIn: ${details}` : 'Failed to connect LinkedIn account.');
    }
  }, [searchParams]);

  const openConnectModal = (platform) => {
    const config = PLATFORM_CONFIG[platform] || {};
    setConnectModalPlatform(platform);
    setCustomHandle(config.defaultHandle || '');
    setTokenInput('');
    setCustomRedirectUri('');
    setActiveConnectTab(platform === 'instagram' ? 'credentials' : 'oauth');
    setCopiedUri(false);
    setInstaStep(1);
    setInstaUsername('');
    setInstaPassword('');
    setInstaCode('');
  };

  const handleTokenConnect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!connectModalPlatform || !tokenInput.trim()) return;
    const config = PLATFORM_CONFIG[connectModalPlatform] || {};
    setIsConnecting(true);
    try {
      const res = await accountsAPI.connectToken({
        platform: connectModalPlatform,
        accessToken: tokenInput.trim(),
      });
      if (res.data?.account) {
        setAccounts(prev => {
          const filtered = prev.filter(a => a._id !== res.data.account._id && a.platformUserId !== res.data.account.platformUserId);
          return [res.data.account, ...filtered];
        });
      }
      toast.success(res.data?.message || `Real ${config.name} account connected successfully!`);
      setConnectModalPlatform(null);
      setTokenInput('');
      refreshAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to verify token with ${config.name} API.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstantConnect = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!connectModalPlatform) return;
    const config = PLATFORM_CONFIG[connectModalPlatform] || {};
    setIsConnecting(true);
    try {
      const handle = (customHandle.trim() || config.defaultHandle || `@Nexus${config.name}`).replace(/^@?/, '@');
      const res = await accountsAPI.connectDemo({
        platform: connectModalPlatform,
        name: handle,
      });
      if (res.data?.account) {
        setAccounts(prev => {
          const filtered = prev.filter(a => a._id !== res.data.account._id && a.platformUserId !== res.data.account.platformUserId);
          return [res.data.account, ...filtered];
        });
      }
      toast.success(`${config.name} account connected successfully!`);
      setConnectModalPlatform(null);
      refreshAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to connect ${config.name} account.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOfficialOAuth = async () => {
    if (!connectModalPlatform) return;
    const config = PLATFORM_CONFIG[connectModalPlatform];
    if (!config || !config.authFunc) return;
    setIsConnecting(true);
    try {
      const targetUri = customRedirectUri.trim() || resolvedRedirectUri;
      const res = await config.authFunc({ redirect_uri: targetUri });
      const targetUrl = res.data?.url;
      if (targetUrl && (targetUrl.startsWith('https://') || targetUrl.startsWith('http://')) && !targetUrl.includes('connected=demo')) {
        window.location.href = targetUrl;
      } else if (targetUrl && targetUrl.includes('connected=demo')) {
        toast.error(`Social backend service (port 5003) is offline. Please start it using 'npm run dev'.`);
      } else {
        toast.error(res.data?.message || `Did not receive an authorization URL from ${config.name}.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to initiate official ${config.name} login.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyUri = () => {
    const targetUri = customRedirectUri.trim() || resolvedRedirectUri;
    navigator.clipboard.writeText(targetUri).then(() => {
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2500);
      toast.success('Redirect URI copied to clipboard!');
    }).catch(() => {
      toast.error('Could not copy automatically. Please copy the text manually.');
    });
  };

  const handlePrivateInstaSubmit = async (e) => {
    e.preventDefault();
    if (!instaUsername) return;

    setConnectingInsta(true);
    try {
      if (instaStep === 1) {
        if (!instaPassword) return;
        const res = await accountsAPI.connectInstagramPrivate({
          username: instaUsername.replace(/^@/, '').trim(),
          password: instaPassword.trim(),
        });
        
        if (res.data?.status === 'challenge_required') {
          toast.success(res.data.message);
          setInstaStep(2);
        } else {
          toast.success('Instagram account connected successfully!');
          setConnectModalPlatform(null);
          setInstaUsername('');
          setInstaPassword('');
          refreshAccounts();
        }
      } else {
        if (!instaCode) return;
        await accountsAPI.connectInstagramPrivate({
          username: instaUsername.replace(/^@/, '').trim(),
          code: instaCode.trim(),
        });
        toast.success('Instagram account connected successfully!');
        setConnectModalPlatform(null);
        setInstaUsername('');
        setInstaPassword('');
        setInstaCode('');
        setInstaStep(1);
        refreshAccounts();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect Instagram account.');
    } finally {
      setConnectingInsta(false);
    }
  };

  const handleDisconnectAccount = async (id) => {
    if (!window.confirm('Are you sure you want to disconnect this account?')) return;
    try {
      await accountsAPI.disconnect(id);
      toast.success('Account disconnected successfully!');
      // Optimistically remove from cache immediately
      setAccounts(prev => prev.filter((acc) => acc._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disconnect account.');
    }
  };

  const currentConfig = connectModalPlatform ? PLATFORM_CONFIG[connectModalPlatform] || {} : {};
  const rawBackendBase = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') ||
    (typeof window !== 'undefined' && (window.location.origin.includes('localhost') || window.location.origin.includes('5180'))
      ? 'http://localhost:5000'
      : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'));
  let cleanBackendBase = rawBackendBase;
  while (/^https?:\/\//i.test(cleanBackendBase)) {
    cleanBackendBase = cleanBackendBase.replace(/^https?:\/\//i, '');
  }
  const isLocalBackend = cleanBackendBase.includes('localhost') || cleanBackendBase.includes('127.0.0.1');
  cleanBackendBase = `${isLocalBackend ? 'http://' : 'https://'}${cleanBackendBase.replace(/\/+$/, '')}`;
  const resolvedRedirectUri = `${cleanBackendBase}${currentConfig.callbackPath || ''}`;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user?.name}</h2>
        <button className="btn-logout" onClick={logout}>Logout</button>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Connected Accounts</h3>
          {accounts.length === 0 ? (
            <p className="empty">No accounts connected</p>
          ) : (
            <ul className="account-list">
              {accounts.map((acc) => (
                <li key={acc._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className={`platform-badge ${acc.platform}`} style={{ marginRight: '8px' }}>{acc.platform}</span>
                    {acc.name}
                  </div>
                  <button 
                    onClick={() => handleDisconnectAccount(acc._id)}
                    style={{
                      background: 'transparent',
                      color: 'var(--danger)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.target.style.borderColor = 'var(--danger)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                    }}
                  >
                    Disconnect
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              style={{ background: '#1877f2' }}
              onClick={() => openConnectModal('facebook')}
            >
              + Connect Facebook
            </button>

            <button
              className="btn-primary"
              style={{ background: 'var(--ig)' }}
              onClick={() => openConnectModal('instagram')}
            >
              + Connect Instagram
            </button>

            <button 
              className="btn-primary" 
              style={{ background: '#bd081c' }} 
              onClick={() => openConnectModal('pinterest')}
            >
              + Connect Pinterest
            </button>
            <button 
              className="btn-primary" 
              style={{ background: '#35465c' }} 
              onClick={() => openConnectModal('tumblr')}
            >
              + Connect Tumblr
            </button>
            <button 
              className="btn-primary" 
              style={{ background: '#0a66c2' }} 
              onClick={() => openConnectModal('linkedin')}
            >
              + Connect LinkedIn
            </button>
          </div>

          <div style={{ marginTop: '14px' }}>
            <button 
              type="button" 
              onClick={() => setShowInstaHelp(!showInstaHelp)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
            >
              {showInstaHelp ? 'Hide requirements' : 'Need help connecting accounts?'}
            </button>
            {showInstaHelp && (
              <div className="insta-help-box">
                <h4>Social Connection Tips:</h4>
                <ol>
                  <li><strong>Instant Workspace Connect:</strong> Connect any profile immediately with 0 configuration. Full posting and scheduling ready!</li>
                  <li><strong>Official OAuth:</strong> Add the displayed Redirect URI into your developer console for official tokens.</li>
                  <li><strong>Instagram:</strong> Switch to the "Instagram Login" tab to connect directly with your credentials.</li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Upcoming Posts</h3>
          {upcomingPosts.length === 0 ? (
            <p className="empty">No scheduled posts</p>
          ) : (
            <div className="upcoming-posts-list">
              {upcomingPosts.slice(0, 5).map((post) => (
                <div key={post._id} className="upcoming-post-card">
                  <div className="upcoming-post-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`platform-badge ${post.platform}`}>{post.platform}</span>
                      {post.account?.name && (
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text)', opacity: 0.85 }}>
                          {post.account.name}
                        </span>
                      )}
                    </div>
                    <div className="upcoming-post-time">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" style={{ width: '12px', height: '12px' }}>
                        <path fillRule="evenodd" d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Zm7.75-4.25a.75.75 0 0 0-1.5 0V8c0 .414.336.75.75.75h3.25a.75.75 0 0 0 0-1.5h-2.5v-3.5Z" clipRule="evenodd" />
                      </svg>
                      {new Date(post.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      &nbsp;·&nbsp;
                      {new Date(post.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <p className="upcoming-post-preview">
                    {post.content.length > 100 ? post.content.slice(0, 100) + '…' : post.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Unified Multi-Platform Connection Modal */}
      {connectModalPlatform && (
        <div className="modal-overlay" onClick={() => setConnectModalPlatform(null)}>
          <div className="modal-content connect-platform-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{currentConfig.icon}</span>
                <div>
                  <h3 className="connect-modal-title">Connect {currentConfig.name}</h3>
                  <span className="connect-modal-subtitle">
                    Nexus OS Social Publishing Hub
                  </span>
                </div>
              </div>
              <button className="btn-close" onClick={() => setConnectModalPlatform(null)}>×</button>
            </div>

            {/* Connection Method Tabs */}
            <div className="connect-modal-tabs">
              <button
                type="button"
                className={`connect-tab-btn ${activeConnectTab === 'oauth' ? 'active' : ''}`}
                onClick={() => setActiveConnectTab('oauth')}
                style={activeConnectTab === 'oauth' ? { background: currentConfig.color || '#4f46e5' } : {}}
              >
                🌐 Official Login (OAuth)
              </button>
              <button
                type="button"
                className={`connect-tab-btn ${activeConnectTab === 'token' ? 'active' : ''}`}
                onClick={() => setActiveConnectTab('token')}
                style={activeConnectTab === 'token' ? { background: currentConfig.color || '#4f46e5' } : {}}
              >
                🔑 Access Token Connect
              </button>
              {connectModalPlatform === 'instagram' && (
                <button
                  type="button"
                  className={`connect-tab-btn ${activeConnectTab === 'credentials' ? 'active' : ''}`}
                  onClick={() => setActiveConnectTab('credentials')}
                  style={activeConnectTab === 'credentials' ? { background: 'linear-gradient(45deg, #f09433, #dc2743, #bc1888)' } : {}}
                >
                  📸 Instagram Login
                </button>
              )}
              <button
                type="button"
                className={`connect-tab-btn ${activeConnectTab === 'instant' ? 'active' : ''}`}
                onClick={() => setActiveConnectTab('instant')}
                style={activeConnectTab === 'instant' ? { background: '#6366f1' } : {}}
              >
                ⚡ Offline Demo
              </button>
            </div>

            {/* TAB 1: Official Developer OAuth */}
            {activeConnectTab === 'oauth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="connect-notice-banner notice-oauth">
                  <strong>Connect Your Real Account:</strong> Clicking the button below opens the official <strong>{currentConfig.name}</strong> authorization window. Log in with your actual {currentConfig.name} profile and approve access to link your live handle, real avatar, and boards.
                </div>

                <div>
                  <label className="connect-modal-label">
                    Redirect URI registered in your {currentConfig.name} Developer App
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customRedirectUri || resolvedRedirectUri}
                      onChange={(e) => setCustomRedirectUri(e.target.value)}
                      className="connect-modal-input"
                      style={{ fontFamily: 'monospace', fontSize: '12px' }}
                      placeholder="e.g. http://localhost:5000/api/accounts/linkedin/callback"
                    />
                    <button
                      type="button"
                      onClick={handleCopyUri}
                      style={{
                        background: copiedUri ? '#10b981' : (currentConfig.color || '#6366f1'),
                        color: '#fff',
                        border: 'none',
                        borderRadius: '9px',
                        padding: '0 16px',
                        fontSize: '12.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      {copiedUri ? '✓ Copied' : 'Copy URI'}
                    </button>
                  </div>

                  {/* Quick Select Presets */}
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Quick Presets:</span>
                    {[
                      `http://localhost:5000${currentConfig.callbackPath || ''}`,
                      `http://localhost:5180${currentConfig.callbackPath || ''}`,
                      `https://nexus-os-qg3c.onrender.com${currentConfig.callbackPath || ''}`
                    ].map((presetUri) => {
                      const isSelected = (customRedirectUri || resolvedRedirectUri) === presetUri;
                      const label = presetUri.includes('5000') ? 'Port 5000 (Gateway)' : presetUri.includes('5180') ? 'Port 5180 (Client)' : 'Production (Render)';
                      return (
                        <button
                          key={presetUri}
                          type="button"
                          onClick={() => setCustomRedirectUri(presetUri)}
                          style={{
                            background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                            border: isSelected ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.16)',
                            color: isSelected ? '#ffffff' : '#cbd5e1',
                            borderRadius: '6px',
                            padding: '3px 9px',
                            fontSize: '11px',
                            fontWeight: isSelected ? '700' : '500',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <p className="connect-hint-text">
                    LinkedIn requires this exact URL to be added in your{' '}
                    <a href={currentConfig.docs} target="_blank" rel="noreferrer" style={{ fontWeight: 700, textDecoration: 'underline' }}>
                      {currentConfig.name} Developer Portal
                    </a>{' '}
                    under <strong>Auth &gt; OAuth 2.0 settings &gt; Authorized redirect URLs for your app</strong>.
                  </p>
                </div>

                <div className="connect-modal-actions">
                  <button
                    type="button"
                    className="connect-btn-cancel"
                    onClick={() => setConnectModalPlatform(null)}
                    disabled={isConnecting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="connect-btn-submit"
                    onClick={handleOfficialOAuth}
                    disabled={isConnecting}
                    style={{ background: currentConfig.color === '#35465c' ? 'linear-gradient(135deg, #001935 0%, #35465c 100%)' : (currentConfig.color || '#4f46e5') }}
                  >
                    {isConnecting ? 'Opening Login...' : `Log in with Real ${currentConfig.name} →`}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Direct Real Access Token Connect */}
            {activeConnectTab === 'token' && (
              <form onSubmit={handleTokenConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="connect-notice-banner notice-token">
                  <strong>Direct Live API Verification:</strong> In your <a href={currentConfig.docs} target="_blank" rel="noreferrer">{currentConfig.name} Developer Console</a>, generate an <strong>Access Token</strong> and paste it below. We will verify it directly with the official {currentConfig.name} API and link your real profile immediately with 0 redirect steps!
                </div>

                <div>
                  <label className="connect-modal-label">
                    {currentConfig.name} User Access Token {connectModalPlatform === 'tumblr' ? '(Token:Secret)' : ''}
                  </label>
                  <input
                    type="password"
                    placeholder={connectModalPlatform === 'tumblr' ? 'oauth_token:oauth_token_secret' : `Paste real ${currentConfig.name} access token...`}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    required
                    disabled={isConnecting}
                    className="connect-modal-input"
                    style={{ fontFamily: 'monospace' }}
                  />
                  {connectModalPlatform === 'tumblr' && (
                    <p className="connect-hint-text">
                      Format: <code>oauth_token:oauth_token_secret</code> from your Tumblr App credentials or developer console.
                    </p>
                  )}
                </div>

                <div className="connect-modal-actions">
                  <button
                    type="button"
                    className="connect-btn-cancel"
                    onClick={() => setConnectModalPlatform(null)}
                    disabled={isConnecting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="connect-btn-submit"
                    disabled={isConnecting}
                    style={{ background: currentConfig.color === '#35465c' ? 'linear-gradient(135deg, #001935 0%, #35465c 100%)' : (currentConfig.color || '#4f46e5') }}
                  >
                    {isConnecting ? 'Verifying with Official API...' : `Verify & Connect Real ${currentConfig.name}`}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: Instant Demo Mockup */}
            {activeConnectTab === 'instant' && (
              <form onSubmit={handleInstantConnect} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="connect-notice-banner notice-demo">
                  <strong>Offline Workspace Mode:</strong> Creates a simulated testing channel without talking to live social network servers.
                </div>

                <div>
                  <label className="connect-modal-label">
                    Mockup Account Handle
                  </label>
                  <input
                    type="text"
                    placeholder={currentConfig.defaultHandle}
                    value={customHandle}
                    onChange={(e) => setCustomHandle(e.target.value)}
                    disabled={isConnecting}
                    className="connect-modal-input"
                  />
                </div>

                <div className="connect-modal-actions">
                  <button
                    type="button"
                    className="connect-btn-cancel"
                    onClick={() => setConnectModalPlatform(null)}
                    disabled={isConnecting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="connect-btn-submit"
                    disabled={isConnecting}
                    style={{ background: currentConfig.color || '#4f46e5' }}
                  >
                    {isConnecting ? 'Connecting...' : `Create Demo Channel`}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 4: Direct Instagram Login */}
            {activeConnectTab === 'credentials' && connectModalPlatform === 'instagram' && (
              <form onSubmit={handlePrivateInstaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {instaStep === 1 ? (
                  <>
                    <p className="connect-hint-text" style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                      Connect directly using your Instagram username and password. No Meta developer setup required.
                    </p>
                    <input
                      type="text"
                      placeholder="Instagram Username (e.g. yourhandle)"
                      value={instaUsername}
                      onChange={(e) => setInstaUsername(e.target.value)}
                      required
                      disabled={connectingInsta}
                      className="connect-modal-input"
                    />
                    <input
                      type="password"
                      placeholder="Instagram Password"
                      value={instaPassword}
                      onChange={(e) => setInstaPassword(e.target.value)}
                      required
                      disabled={connectingInsta}
                      className="connect-modal-input"
                    />
                    <div className="connect-modal-actions">
                      <button
                        type="button"
                        className="connect-btn-cancel"
                        onClick={() => setConnectModalPlatform(null)}
                        disabled={connectingInsta}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="connect-btn-submit"
                        disabled={connectingInsta}
                        style={{ background: 'var(--ig)' }}
                      >
                        {connectingInsta ? 'Connecting...' : 'Connect Profile'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="connect-hint-text" style={{ fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                      Security check: Please enter the verification code sent to your email or SMS.
                    </p>
                    <input
                      type="text"
                      placeholder="Verification Code (e.g. 123456)"
                      value={instaCode}
                      onChange={(e) => setInstaCode(e.target.value)}
                      required
                      disabled={connectingInsta}
                      className="connect-modal-input"
                    />
                    <div className="connect-modal-actions">
                      <button
                        type="button"
                        className="connect-btn-cancel"
                        onClick={() => { setInstaStep(1); setInstaCode(''); }}
                        disabled={connectingInsta}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="connect-btn-submit"
                        disabled={connectingInsta}
                        style={{ background: 'var(--ig)' }}
                      >
                        {connectingInsta ? 'Verifying...' : 'Verify Code'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
