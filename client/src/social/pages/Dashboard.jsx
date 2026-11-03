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
    docs: 'https://www.linkedin.com/developers/apps',
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeConnectTab, setActiveConnectTab] = useState('instant'); // 'instant' | 'oauth' | 'credentials'
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
    } else if (searchParams.get('error') === 'tumblr_auth_failed') {
      toast.error('Failed to connect Tumblr account.');
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
    setActiveConnectTab('instant');
    setCopiedUri(false);
    setInstaStep(1);
    setInstaUsername('');
    setInstaPassword('');
    setInstaCode('');
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
      const res = await config.authFunc();
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Did not receive an authorization URL from the server.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to initiate official ${config.name} login.`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopyUri = () => {
    const config = PLATFORM_CONFIG[connectModalPlatform] || {};
    const origin = window.location.origin.includes('5180') ? 'http://localhost:5000' : window.location.origin;
    const uri = `${origin}${config.callbackPath || ''}`;
    navigator.clipboard.writeText(uri).then(() => {
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
  const origin = typeof window !== 'undefined' && window.location.origin.includes('5180') ? 'http://localhost:5000' : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
  const resolvedRedirectUri = `${origin}${currentConfig.callbackPath || ''}`;

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
          <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>{currentConfig.icon}</span>
                <div>
                  <h3 style={{ margin: 0 }}>Connect {currentConfig.name}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Nexus OS Social Publishing Hub
                  </span>
                </div>
              </div>
              <button className="btn-close" onClick={() => setConnectModalPlatform(null)}>×</button>
            </div>

            {/* Connection Method Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveConnectTab('instant')}
                style={{
                  background: activeConnectTab === 'instant' ? 'var(--primary, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeConnectTab === 'instant' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                ⚡ Instant Connect
              </button>
              <button
                type="button"
                onClick={() => setActiveConnectTab('oauth')}
                style={{
                  background: activeConnectTab === 'oauth' ? 'var(--primary, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                  color: activeConnectTab === 'oauth' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                🌐 Official OAuth
              </button>
              {connectModalPlatform === 'instagram' && (
                <button
                  type="button"
                  onClick={() => setActiveConnectTab('credentials')}
                  style={{
                    background: activeConnectTab === 'credentials' ? 'var(--primary, #6366f1)' : 'rgba(255, 255, 255, 0.05)',
                    color: activeConnectTab === 'credentials' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  🔑 Instagram Login
                </button>
              )}
            </div>

            {/* TAB 1: Instant Connect */}
            {activeConnectTab === 'instant' && (
              <form onSubmit={handleInstantConnect} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  <strong>⚡ Instant Setup (0 Developer Config):</strong> Connects your {currentConfig.name} channel directly. Full support for AI caption generation, image scheduling, automated queue publishing, and calendar tracking.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Account Handle / Display Name
                  </label>
                  <input
                    type="text"
                    placeholder={currentConfig.defaultHandle}
                    value={customHandle}
                    onChange={(e) => setCustomHandle(e.target.value)}
                    disabled={isConnecting}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-logout"
                    onClick={() => setConnectModalPlatform(null)}
                    disabled={isConnecting}
                    style={{ padding: '8px 16px', margin: 0, fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isConnecting}
                    style={{ padding: '8px 20px', fontSize: '13px', background: currentConfig.color }}
                  >
                    {isConnecting ? 'Connecting...' : `⚡ Connect ${currentConfig.name} Instantly`}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: Official Developer OAuth */}
            {activeConnectTab === 'oauth' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>
                  <strong>Developer Redirect URI:</strong> Ensure this exact URI is whitelisted in your {currentConfig.name} Developer Portal under <em>Redirect URIs</em> to prevent <code>400 URI mismatch</code> errors.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Registered Redirect URI for Developer Console
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      readOnly
                      value={resolvedRedirectUri}
                      style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', fontFamily: 'monospace', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      onClick={handleCopyUri}
                      style={{
                        background: copiedUri ? '#10b981' : 'var(--primary, #6366f1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0 14px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s',
                      }}
                    >
                      {copiedUri ? '✓ Copied' : 'Copy URI'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn-logout"
                    onClick={() => setConnectModalPlatform(null)}
                    disabled={isConnecting}
                    style={{ padding: '8px 16px', margin: 0, fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleOfficialOAuth}
                    disabled={isConnecting}
                    style={{ padding: '8px 20px', fontSize: '13px', background: currentConfig.color }}
                  >
                    {isConnecting ? 'Redirecting...' : `Continue to Official ${currentConfig.name} Login →`}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Direct Instagram Login */}
            {activeConnectTab === 'credentials' && connectModalPlatform === 'instagram' && (
              <form onSubmit={handlePrivateInstaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {instaStep === 1 ? (
                  <>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                      Connect directly using your Instagram username and password. No Meta developer setup required.
                    </p>
                    <input
                      type="text"
                      placeholder="Instagram Username (e.g. yourhandle)"
                      value={instaUsername}
                      onChange={(e) => setInstaUsername(e.target.value)}
                      required
                      disabled={connectingInsta}
                    />
                    <input
                      type="password"
                      placeholder="Instagram Password"
                      value={instaPassword}
                      onChange={(e) => setInstaPassword(e.target.value)}
                      required
                      disabled={connectingInsta}
                    />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn-logout"
                        onClick={() => setConnectModalPlatform(null)}
                        disabled={connectingInsta}
                        style={{ padding: '8px 16px', margin: 0, fontSize: '13px' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={connectingInsta}
                        style={{ padding: '8px 20px', fontSize: '13px', background: 'var(--ig)' }}
                      >
                        {connectingInsta ? 'Connecting...' : 'Connect Profile'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                      Security check: Please enter the verification code sent to your email or SMS.
                    </p>
                    <input
                      type="text"
                      placeholder="Verification Code (e.g. 123456)"
                      value={instaCode}
                      onChange={(e) => setInstaCode(e.target.value)}
                      required
                      disabled={connectingInsta}
                    />
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button
                        type="button"
                        className="btn-logout"
                        onClick={() => { setInstaStep(1); setInstaCode(''); }}
                        disabled={connectingInsta}
                        style={{ padding: '8px 16px', margin: 0, fontSize: '13px' }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={connectingInsta}
                        style={{ padding: '8px 20px', fontSize: '13px' }}
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
