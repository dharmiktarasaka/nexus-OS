// client/src/website/components/DomainDeployModal.jsx - Automatic tarasaka.com Subdomain Deployment
import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Check,
  Copy,
  ExternalLink,
  Rocket,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getWebsiteApiUrl } from '../apiConfig';

export default function DomainDeployModal({ isOpen, onClose, project, onSubdomainUpdated }) {
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('tarasaka.com');
  const [copiedSubdomain, setCopiedSubdomain] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [showDnsGuide, setShowDnsGuide] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      const initialSub = project.subdomain || (project.name || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30) || 'site';
      setSubdomain(initialSub);
      setCustomDomain(project.customDomain || 'tarasaka.com');
      setIsAvailable(true);
      setStatusMessage(null);
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const currentSubdomain = project.subdomain || subdomain || 'site';
  const liveSubdomainUrl = `https://${currentSubdomain}.${customDomain}`;
  const directPathUrl = `https://${customDomain}/sites/${currentSubdomain}`;
  const localPreviewUrl = `${window.location.origin}/live/${currentSubdomain}`;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'subdomain') {
      setCopiedSubdomain(true);
      setTimeout(() => setCopiedSubdomain(false), 2000);
    } else {
      setCopiedDirect(true);
      setTimeout(() => setCopiedDirect(false), 2000);
    }
  };

  const handleCheckSubdomain = async (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
    setSubdomain(clean);
    if (!clean || clean.length < 3) {
      setIsAvailable(false);
      return;
    }

    setCheckingAvailability(true);
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/subdomain/check/${clean}?excludeId=${project.id}`));
      if (res.ok) {
        const data = await res.json();
        setIsAvailable(data.available);
      } else {
        setIsAvailable(true);
      }
    } catch (_err) {
      setIsAvailable(true);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSaveSubdomain = async (e) => {
    e?.preventDefault();
    if (!subdomain.trim() || saving || isAvailable === false) return;

    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${project.id}/subdomain`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain: subdomain.trim().toLowerCase() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `✓ Successfully attached to ${data.subdomain}.${customDomain}!` });
        if (onSubdomainUpdated) {
          onSubdomainUpdated(data.project || { ...project, subdomain: data.subdomain, publishedUrl: data.publishedUrl });
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to update subdomain' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Connection error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRedeploy = async () => {
    setDeploying(true);
    setStatusMessage(null);
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${project.id}/deploy`), {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: `🚀 Website live deployed to ${data.subdomain}.${customDomain}!` });
        if (onSubdomainUpdated) {
          onSubdomainUpdated(data.project || { ...project, isPublished: true, subdomain: data.subdomain, publishedUrl: data.publishedUrl });
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Deployment failed' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: 'var(--bg-surface, #1e293b)',
          color: 'var(--text-main, #f8fafc)',
          borderRadius: '20px',
          border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)'
              }}
            >
              <Globe size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Automatic <span style={{ color: '#60a5fa' }}>tarasaka.com</span> Deployment
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted, #94a3b8)' }}>
                Your website is automatically attached to your primary domain with SSL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #94a3b8)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Alert Banner */}
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981'
                }}
              />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#34d399' }}>
                  Live on tarasaka.com Subdomain
                </span>
                <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>
                  Users can directly visit without setting up their own domain
                </p>
              </div>
            </div>

            <button
              onClick={handleRedeploy}
              disabled={deploying}
              style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: deploying ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <RefreshCw size={12} className={deploying ? 'animate-spin' : ''} />
              <span>{deploying ? 'Deploying...' : 'Redeploy'}</span>
            </button>
          </div>

          {/* Primary Live Subdomain Link Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>
              PRIMARY LIVE URL (Subdomain)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                borderRadius: '12px',
                padding: '8px 12px'
              }}
            >
              <Globe size={16} color="#60a5fa" />
              <input
                type="text"
                readOnly
                value={liveSubdomainUrl}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={() => handleCopy(liveSubdomainUrl, 'subdomain')}
                title="Copy Live URL"
                style={{
                  background: copiedSubdomain ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: copiedSubdomain ? '#34d399' : 'var(--text-main, #f8fafc)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedSubdomain ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedSubdomain ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={liveSubdomainUrl}
                target="_blank"
                rel="noreferrer"
                title="Visit Live Site"
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Visit</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Direct Path Fallback Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>
              INSTANT DIRECT FALLBACK (Pre-DNS link)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
                borderRadius: '12px',
                padding: '8px 12px'
              }}
            >
              <LinkIcon size={16} color="#a855f7" />
              <input
                type="text"
                readOnly
                value={directPathUrl}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <button
                onClick={() => handleCopy(directPathUrl, 'direct')}
                title="Copy Direct Link"
                style={{
                  background: copiedDirect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: copiedDirect ? '#34d399' : 'var(--text-main, #f8fafc)',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedDirect ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedDirect ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={`/sites/${currentSubdomain}`}
                target="_blank"
                rel="noreferrer"
                title="Preview Direct URL"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Test ↗</span>
              </a>
            </div>
          </div>

          {/* Customize Subdomain Form */}
          <form onSubmit={handleSaveSubdomain} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #94a3b8)' }}>
                CUSTOMIZE SUBDOMAIN SLUG
              </label>
              {checkingAvailability ? (
                <span style={{ fontSize: '11px', color: '#fbbf24' }}>Checking availability...</span>
              ) : isAvailable === true ? (
                <span style={{ fontSize: '11px', color: '#34d399' }}>✓ Available on tarasaka.com</span>
              ) : isAvailable === false ? (
                <span style={{ fontSize: '11px', color: '#f87171' }}>✗ Taken or invalid slug</span>
              ) : null}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${isAvailable === false ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-medium, rgba(255, 255, 255, 0.15))'}`,
                  borderRadius: '12px',
                  padding: '0 12px',
                  overflow: 'hidden'
                }}
              >
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => handleCheckSubdomain(e.target.value)}
                  placeholder="e.g. dentist-care"
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '10px 0',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
                <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '13px', userSelect: 'none' }}>
                  .{customDomain}
                </span>
              </div>

              <button
                type="submit"
                disabled={saving || isAvailable === false || subdomain === project.subdomain}
                style={{
                  padding: '0 16px',
                  background: subdomain !== project.subdomain && isAvailable !== false ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: subdomain !== project.subdomain && isAvailable !== false ? 'pointer' : 'not-allowed'
                }}
              >
                {saving ? 'Updating...' : 'Save Slug'}
              </button>
            </div>
          </form>

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: statusMessage.type === 'success' ? '#34d399' : '#f87171',
                border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}
            >
              {statusMessage.text}
            </div>
          )}

          {/* DNS Wildcard Setup Guide Accordion */}
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
              background: 'rgba(255, 255, 255, 0.02)',
              overflow: 'hidden'
            }}
          >
            <button
              onClick={() => setShowDnsGuide(!showDnsGuide)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #94a3b8)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={14} color="#60a5fa" />
                <span>How tarasaka.com Wildcard DNS Works</span>
              </div>
              {showDnsGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showDnsGuide && (
              <div style={{ padding: '0 16px 14px 16px', fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  In your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.) for <strong>tarasaka.com</strong>:
                </p>
                <div style={{ background: '#090d16', padding: '10px 12px', borderRadius: '8px', fontFamily: 'monospace', color: '#38bdf8' }}>
                  Type: CNAME &nbsp;|&nbsp; Name: * &nbsp;|&nbsp; Value: your-server-domain or A Record @
                </div>
                <p style={{ margin: '8px 0 0 0' }}>
                  With a single wildcard record (<code>*.tarasaka.com</code>), every website created by any user instantly gets a live, SSL-secured address automatically!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.15))',
              background: 'transparent',
              color: 'var(--text-main, #f8fafc)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <a
            href={liveSubdomainUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>Open {currentSubdomain}.tarasaka.com</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
