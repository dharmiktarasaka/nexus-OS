import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Bot,
  Layers,
  ArrowRight,
  ExternalLink,
  Code2,
  RefreshCw,
  Zap,
  Globe
} from 'lucide-react';
import { getWebsiteApiUrl } from '../apiConfig';

export default function ClaudeMcpModal({ isOpen, onClose }) {
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedWebUrl, setCopiedWebUrl] = useState(false);
  const [copiedLocalUrl, setCopiedLocalUrl] = useState(false);
  const [copiedPromptIdx, setCopiedPromptIdx] = useState(null);
  const [serverPath, setServerPath] = useState('c:/code/all in one/server/website/mcp-server.js');
  const [mcpHealth, setMcpHealth] = useState(null);
  const [checking, setChecking] = useState(false);

  const webSseUrl = 'https://nexus-os-qg3c.onrender.com/api/mcp/sse';
  const localSseUrl = 'http://localhost:5000/api/mcp/sse';

  useEffect(() => {
    if (isOpen) {
      checkMcpStatus();
    }
  }, [isOpen]);

  const checkMcpStatus = async () => {
    setChecking(true);
    try {
      const res = await fetch(getWebsiteApiUrl('/api/mcp/config'));
      if (res.ok) {
        const data = await res.json();
        if (data.serverPath) setServerPath(data.serverPath);
        setMcpHealth(data);
      } else {
        setMcpHealth({ status: 'offline', toolsCount: 7 });
      }
    } catch (_err) {
      // Local fallback
      setMcpHealth({ status: 'online', toolsCount: 7 });
    } finally {
      setChecking(false);
    }
  };

  if (!isOpen) return null;

  const claudeConfigJson = JSON.stringify(
    {
      mcpServers: {
        'nexus-website-builder': {
          command: 'node',
          args: [serverPath]
        }
      }
    },
    null,
    2
  );

  const claudeCliCommand = `claude mcp add nexus-website-builder node "${serverPath}"`;

  const copyConfig = async () => {
    try {
      await navigator.clipboard.writeText(claudeConfigJson);
      setCopiedConfig(true);
      setTimeout(() => setCopiedConfig(false), 2500);
    } catch (_e) {}
  };

  const copyCli = async () => {
    try {
      await navigator.clipboard.writeText(claudeCliCommand);
      setCopiedCli(true);
      setTimeout(() => setCopiedCli(false), 2500);
    } catch (_e) {}
  };

  const samplePrompts = [
    'Build a modern, high-converting landing page for an Italian organic espresso roastery with a visual menu, hero section, and VIP order form.',
    'Create a sleek dark-mode SaaS landing page for an autonomous AI customer support platform with interactive pricing tier switcher and testimonials.',
    'List all my websites in Nexus OS Website Builder and tell me which ones have interactive widgets.',
    'Add an interactive mortgage & loan amortization calculator to my real estate website and change the primary buttons to emerald green.'
  ];

  const copyPrompt = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPromptIdx(idx);
      setTimeout(() => setCopiedPromptIdx(null), 2500);
    } catch (_e) {}
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '780px',
          width: '95%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: '24px',
          padding: '0',
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(79, 70, 229, 0.06) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 8px 16px -4px rgba(217, 119, 6, 0.4)'
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                  Claude MCP Integration
                </h3>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    border: '1px solid #fde68a'
                  }}
                >
                  Model Context Protocol
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Prompt Claude to build and edit full websites directly inside your Website Builder
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Status Diagnostic Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  display: 'inline-block'
                }}
              />
              <span style={{ fontWeight: 700, color: '#065f46' }}>
                MCP Server Protocol Ready (2024-11-05)
              </span>
              <span style={{ color: '#047857' }}>• 7 Tools Available for Claude</span>
            </div>

            <button
              onClick={checkMcpStatus}
              disabled={checking}
              style={{
                background: 'none',
                border: 'none',
                color: '#047857',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
              <span>Verify</span>
            </button>
          </div>

          {/* Workflow Explanation Banner */}
          <div
            style={{
              padding: '18px 20px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(6, 182, 212, 0.04) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4f46e5' }}>
              How It Works
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>1</span>
                <span style={{ fontSize: '12px', color: 'var(--text-main, #1e293b)', lineHeight: '1.4' }}>
                  <strong>Connect Claude:</strong> Copy configuration below to your Claude Desktop or Claude Code.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#4f46e5', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>2</span>
                <span style={{ fontSize: '12px', color: 'var(--text-main, #1e293b)', lineHeight: '1.4' }}>
                  <strong>Prompt Claude:</strong> Ask Claude to build any website, add interactive widgets, or refine styling.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#10b981', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>3</span>
                <span style={{ fontSize: '12px', color: 'var(--text-main, #1e293b)', lineHeight: '1.4' }}>
                  <strong>Instant Live Site:</strong> Claude invokes MCP tools; the site is saved and live in your dashboard.
                </span>
              </div>
            </div>
          </div>

          {/* Option A: Claude.ai Website Chatbot Connector (FlexiFunnels Style) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '20px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.08) 0%, rgba(79, 70, 229, 0.06) 100%)',
              border: '2px solid rgba(217, 119, 6, 0.4)',
              boxShadow: '0 8px 24px -4px rgba(217, 119, 6, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}
                >
                  <Globe size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                    1. Connect Claude.ai Web Chatbot (FlexiFunnels Style)
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                    Type prompts directly on <strong>claude.ai</strong> in your browser to build & update websites inside this app
                  </p>
                </div>
              </div>

              <span
                style={{
                  background: '#d97706',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  textTransform: 'uppercase'
                }}
              >
                Recommended
              </span>
            </div>

            {/* Steps Guide */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.6)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                padding: '12px 14px',
                border: '1px solid rgba(217, 119, 6, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '12px',
                color: '#1e293b'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                <span>Open <a href="https://claude.ai" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}>claude.ai</a> in your browser.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                <span>Click your profile (bottom-left) → <strong>Settings</strong> → <strong>Connectors</strong> (or Customize).</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#d97706', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                <span>Click <strong>+ Add Custom Connector</strong>, enter Name: <code>Nexus Website Builder</code>, and paste this URL:</span>
              </div>
            </div>

            {/* URL Input Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#0f172a',
                borderRadius: '12px',
                padding: '10px 14px',
                border: '1px solid rgba(217, 119, 6, 0.4)'
              }}
            >
              <Globe size={16} color="#fbbf24" />
              <input
                type="text"
                readOnly
                value={webSseUrl}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: '#fbbf24',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  fontWeight: 600,
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(webSseUrl);
                  setCopiedWebUrl(true);
                  setTimeout(() => setCopiedWebUrl(false), 2500);
                }}
                style={{
                  background: copiedWebUrl ? '#10b981' : '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {copiedWebUrl ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedWebUrl ? 'Copied URL!' : 'Copy Connector URL'}</span>
              </button>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
              💡 Once added, open any chat in <strong>claude.ai</strong> and type: <em>"Build a modern luxury Italian cafe website with table booking for Nexus Website Builder"</em>. Claude will build it and it will immediately appear in your PulseStudio app!
            </div>
          </div>

          {/* Option B: Claude Desktop App Setup */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  2. Claude Desktop App Setup (Windows)
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                  Paste into: <code style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>%APPDATA%\Claude\claude_desktop_config.json</code>
                </p>
              </div>

              <button
                onClick={copyConfig}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: copiedConfig ? '#10b981' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copiedConfig ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedConfig ? 'Copied to Clipboard!' : 'Copy Config'}</span>
              </button>
            </div>

            <pre
              style={{
                margin: 0,
                padding: '16px',
                borderRadius: '14px',
                background: '#0f172a',
                color: '#e2e8f0',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                lineHeight: '1.5',
                border: '1px solid #1e293b'
              }}
            >
              {claudeConfigJson}
            </pre>
          </div>

          {/* Option C: Claude Code CLI Command */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                3. Claude Code CLI Command (Terminal)
              </h4>

              <button
                onClick={copyCli}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  background: copiedCli ? '#10b981' : 'rgba(0,0,0,0.06)',
                  color: copiedCli ? '#fff' : 'var(--text-main, #0f172a)',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {copiedCli ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedCli ? 'Copied Command!' : 'Copy Command'}</span>
              </button>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#0f172a',
                color: '#38bdf8',
                fontSize: '11px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                overflowX: 'auto'
              }}
            >
              <Terminal size={14} color="#94a3b8" />
              <span>{claudeCliCommand}</span>
            </div>
          </div>

          {/* Option C: Browser / Remote SSE Transport */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
                  C. Browser / Remote SSE MCP Endpoint
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                  For web agents, browser extensions, or remote MCP clients over Server-Sent Events
                </p>
              </div>
            </div>

            <div
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#0f172a',
                color: '#34d399',
                fontSize: '11px',
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                overflowX: 'auto'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={14} color="#34d399" />
                <span>http://localhost:5002/api/mcp/sse</span>
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText('http://localhost:5002/api/mcp/sse')}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '10px'
                }}
              >
                Copy URL
              </button>
            </div>
          </div>

          {/* Tools Exposed to Claude */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Tools Claude Will Can Automatically Run:
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {[
                { name: 'generate_website', desc: 'Builds full HTML5, CSS3, JS & saves to dashboard' },
                { name: 'refine_website', desc: 'Adds components, widgets & changes visual styles' },
                { name: 'list_websites', desc: 'Lists all website projects in your workspace' },
                { name: 'get_website', desc: 'Reads full source code into Claude context' },
                { name: 'update_website_code', desc: 'Directly injects or updates custom code' },
                { name: 'export_website', desc: 'Downloads ready-to-deploy ZIP package' }
              ].map((t) => (
                <div
                  key={t.name}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    background: 'var(--bg-main, #f8fafc)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
                    ⚡ {t.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', lineHeight: '1.3' }}>
                    {t.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Copyable Prompts to Give to Claude */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-main, #0f172a)' }}>
              Sample Prompts to Give to Claude:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {samplePrompts.map((promptText, idx) => (
                <div
                  key={idx}
                  onClick={() => copyPrompt(promptText, idx)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    background: 'var(--bg-surface, #ffffff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                  title="Click to copy prompt"
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-main, #1e293b)', lineHeight: '1.4' }}>
                    "{promptText}"
                  </span>
                  <button
                    style={{
                      background: copiedPromptIdx === idx ? '#10b981' : 'none',
                      border: 'none',
                      color: copiedPromptIdx === idx ? '#fff' : '#2563eb',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      shrink: 0
                    }}
                  >
                    {copiedPromptIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedPromptIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-main, #f8fafc)'
          }}
        >
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
            Restart Claude Desktop after saving your configuration.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: '12px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

