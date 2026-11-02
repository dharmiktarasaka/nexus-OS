import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useData } from '../context/DataContext.jsx';
import { accountsAPI } from '../api/index.js';
import { signInWithPopup, FacebookAuthProvider } from 'firebase/auth';
import { auth, facebookProvider } from '../config/firebase.js';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { accounts, posts, refreshAccounts, setAccounts } = useData();
  const [searchParams] = useSearchParams();
  const [showInstaHelp, setShowInstaHelp] = useState(false);
  const [showInstaModal, setShowInstaModal] = useState(false);
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

  const handleConnectFacebook = async () => {
    try {
      const res = await accountsAPI.facebookAuth();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start Facebook authentication.');
    }
  };

  const handleConnectPinterest = async () => {
    try {
      const res = await accountsAPI.pinterestAuth();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start Pinterest authentication.');
    }
  };

  const handleConnectTumblr = async () => {
    try {
      const res = await accountsAPI.tumblrAuth();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start Tumblr authentication.');
    }
  };

  const handleConnectLinkedin = async () => {
    try {
      const res = await accountsAPI.linkedinAuth();
      window.location.href = res.data.url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start LinkedIn authentication.');
    }
  };


  const handleConnectInstagram = () => {
    setShowInstaModal(true);
    setInstaStep(1);
    setInstaUsername('');
    setInstaPassword('');
    setInstaCode('');
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
          setShowInstaModal(false);
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
        setShowInstaModal(false);
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
              onClick={handleConnectFacebook}
            >
              + Connect Facebook
            </button>

            <button
              className="btn-primary"
              style={{ background: 'var(--ig)' }}
              onClick={handleConnectInstagram}
            >
              + Connect Instagram
            </button>

            <button 
              className="btn-primary" 
              style={{ background: '#bd081c' }} 
              onClick={handleConnectPinterest}
            >
              + Connect Pinterest
            </button>
            <button 
              className="btn-primary" 
              style={{ background: '#35465c' }} 
              onClick={handleConnectTumblr}
            >
              + Connect Tumblr
            </button>
            <button 
              className="btn-primary" 
              style={{ background: '#0a66c2' }} 
              onClick={handleConnectLinkedin}
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
              {showInstaHelp ? 'Hide requirements' : 'Need help connecting Instagram?'}
            </button>
            {showInstaHelp && (
              <div className="insta-help-box">
                <h4>Instagram Requirements:</h4>
                <ol>
                  <li>Must be a <strong>Professional Account</strong> (Creator or Business). Personal accounts are not supported by the Meta API.</li>
                  <li>Must be <strong>linked to a Facebook Page</strong> where you are an Admin.</li>
                  <li>When signing in, you must select <strong>both</strong> the page and the linked Instagram account and accept all scopes.</li>
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

      {showInstaModal && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <h3 style={{ marginBottom: '8px' }}>Connect Instagram Profile</h3>
            
            {instaStep === 1 ? (
              <>
                <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px', lineHeight: '1.4' }}>
                  Connect directly using your Instagram username and password. No Meta configuration, App review, or Facebook developer settings needed!
                </p>
                <form onSubmit={handlePrivateInstaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input
                    type="text"
                    placeholder="Instagram Username (e.g. taylorswift)"
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
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      className="btn-logout" 
                      onClick={() => setShowInstaModal(false)}
                      disabled={connectingInsta}
                      style={{ padding: '10px 16px', margin: 0, fontSize: '14px' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={connectingInsta}
                      style={{ padding: '10px 20px', fontSize: '14px' }}
                    >
                      {connectingInsta ? 'Connecting...' : 'Connect'}
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await accountsAPI.instagramAuth();
                          if (res.data?.url) {
                            window.location.href = res.data.url;
                          }
                        } catch (e) {
                          toast.error('Failed to connect Instagram profile');
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px dashed rgba(255, 255, 255, 0.25)',
                        color: 'var(--text-secondary)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      ⚡ Quick Connect Demo Instagram Profile
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '18px', lineHeight: '1.4' }}>
                  Instagram requires verification to trust this login attempt. Please enter the security code sent to your email or mobile device.
                </p>
                <form onSubmit={handlePrivateInstaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input
                    type="text"
                    placeholder="Verification Code (e.g. 123456)"
                    value={instaCode}
                    onChange={(e) => setInstaCode(e.target.value)}
                    required
                    disabled={connectingInsta}
                  />
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      className="btn-logout" 
                      onClick={() => { setInstaStep(1); setInstaCode(''); }}
                      disabled={connectingInsta}
                      style={{ padding: '10px 16px', margin: 0, fontSize: '14px' }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={connectingInsta}
                      style={{ padding: '10px 20px', fontSize: '14px' }}
                    >
                      {connectingInsta ? 'Verifying...' : 'Verify Code'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
