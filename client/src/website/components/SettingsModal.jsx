// client/src/components/SettingsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Check, RefreshCw, Cpu, Database } from 'lucide-react';
import { getWebsiteApiUrl } from '../apiConfig';

export default function SettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [firebaseConfigStr, setFirebaseConfigStr] = useState('');
  const [mongoUri, setMongoUri] = useState('');
  const [serverHealth, setServerHealth] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch(getWebsiteApiUrl('/api/health'));
      const data = await res.json();
      setServerHealth(data);
    } catch (err) {
      setServerHealth({ error: err.message, status: 'offline' });
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setApiKey(localStorage.getItem('gemini_custom_api_key') || '');
      setFirebaseConfigStr(localStorage.getItem('custom_firebase_config') || '');
      setMongoUri(localStorage.getItem('custom_mongodb_uri') || '');
      checkHealth();
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_custom_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_custom_api_key');
    }

    if (mongoUri.trim()) {
      localStorage.setItem('custom_mongodb_uri', mongoUri.trim());
    } else {
      localStorage.removeItem('custom_mongodb_uri');
    }

    if (firebaseConfigStr.trim()) {
      try {
        JSON.parse(firebaseConfigStr.trim());
        localStorage.setItem('custom_firebase_config', firebaseConfigStr.trim());
      } catch (_e) {
        alert('Invalid Firebase Config JSON format.');
        return;
      }
    } else {
      localStorage.removeItem('custom_firebase_config');
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  const isMongoLive = Boolean(serverHealth?.database?.connected);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Cpu size={22} className="accent-icon" />
            <h3>Studio Settings & Integrations</h3>
          </div>
          <button className="icon-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          {/* Server & MongoDB Live Diagnostic Banner */}
          <div className="status-banner">
            <div className="status-info">
              <span className={`status-pill ${serverHealth?.status === 'online' ? 'online' : 'warning'}`}>
                {serverHealth?.status === 'online' ? '● Backend API Online' : '○ Checking Backend API'}
              </span>
              <span className={`status-pill ${isMongoLive ? 'online' : 'warning'}`}>
                <Database size={12} />
                {isMongoLive
                  ? `● MongoDB Connected (${serverHealth?.database?.name || 'pulse_studio'})`
                  : '○ MongoDB Connecting / File Resilient Mode'}
              </span>
              <span className="subtext">
                Stored in MongoDB: <strong>{serverHealth?.database?.userCount || 0} users</strong>, <strong>{serverHealth?.database?.projectCount || 0} websites</strong>
              </span>
            </div>
            <button className="btn-refresh" onClick={checkHealth} disabled={loadingHealth} title="Refresh connection diagnostic">
              <RefreshCw size={14} className={loadingHealth ? 'spin' : ''} />
            </button>
          </div>

          {/* MongoDB Connection Info */}
          <div className="form-field">
            <label className="field-label">
              <Database size={16} />
              <span>MongoDB Database Configuration</span>
            </label>
            <p className="field-help">
              Users and generated websites are stored directly in MongoDB. Set <code>MONGODB_URI</code> in <code>server/.env</code> to point to your local MongoDB daemon or MongoDB Atlas cloud cluster.
            </p>
            <input
              type="text"
              className="text-input"
              placeholder="mongodb://127.0.0.1:27017/pulse_studio or mongodb+srv://..."
              value={mongoUri}
              onChange={e => setMongoUri(e.target.value)}
            />
          </div>

          {/* Gemini API Key */}
          <div className="form-field">
            <label className="field-label">
              <Key size={16} />
              <span>Google Gemini API Key (Optional)</span>
            </label>
            <p className="field-help">
              If left blank, the studio seamlessly uses the built-in synthesis engine. Provide your own key to invoke Gemini 2.5 directly.
            </p>
            <input
              type="password"
              className="text-input"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
          </div>

          {/* Firebase Credentials */}
          <div className="form-field">
            <label className="field-label">
              <Shield size={16} />
              <span>Custom Firebase Web Config (Optional)</span>
            </label>
            <p className="field-help">
              Paste your <code>firebaseConfig</code> JSON object. Any authenticated Firebase/Google user is automatically synchronized into MongoDB!
            </p>
            <textarea
              className="text-area mono"
              rows={3}
              placeholder={`{\n  "apiKey": "AIzaSy...",\n  "projectId": "your-app"\n}`}
              value={firebaseConfigStr}
              onChange={e => setFirebaseConfigStr(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>
            {savedSuccess ? <Check size={16} /> : null}
            {savedSuccess ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
