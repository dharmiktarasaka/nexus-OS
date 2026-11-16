// client/src/website/components/DocsModal.jsx - AI Coding Agent Documentation
import React, { useState } from 'react';
import { X, BookOpen, Terminal, Cpu, Layers, Sparkles, Shield, Wrench, ExternalLink, Code } from 'lucide-react';

export default function DocsModal({ isOpen, onClose }) {
  const [activeDocTab, setActiveDocTab] = useState('agent');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '820px',
          width: '90%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '18px',
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-main, #0f172a)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={20} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              AI Coding Agent Documentation
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <button
            onClick={() => setActiveDocTab('agent')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeDocTab === 'agent' ? '#2563eb' : 'transparent',
              color: activeDocTab === 'agent' ? '#ffffff' : '#64748b'
            }}
          >
            <Sparkles size={14} />
            Coding Agent
          </button>
          <button
            onClick={() => setActiveDocTab('tools')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeDocTab === 'tools' ? '#2563eb' : 'transparent',
              color: activeDocTab === 'tools' ? '#ffffff' : '#64748b'
            }}
          >
            <Wrench size={14} />
            Agent Tools
          </button>
          <button
            onClick={() => setActiveDocTab('mcp')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeDocTab === 'mcp' ? '#2563eb' : 'transparent',
              color: activeDocTab === 'mcp' ? '#ffffff' : '#64748b'
            }}
          >
            <Terminal size={14} />
            MCP Protocol
          </button>
          <button
            onClick={() => setActiveDocTab('deploy')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeDocTab === 'deploy' ? '#2563eb' : 'transparent',
              color: activeDocTab === 'deploy' ? '#ffffff' : '#64748b'
            }}
          >
            <Layers size={14} />
            Deployment
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, fontSize: '14px', lineHeight: 1.6 }}>
          {activeDocTab === 'agent' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '8px' }}>
                How the Real Claude Coding Agent Works
              </h4>
              <p style={{ color: '#475569', marginBottom: '16px' }}>
                Unlike static template generators, PulseStudio connects directly to the official Anthropic Claude API (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>@anthropic-ai/sdk</code>).
                Claude operates as an autonomous agent with tool-calling capabilities. When you type a prompt, Claude inspects the existing files, creates or modifies individual project files, runs syntax checks, and refreshes the preview.
              </p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                  Supported Anthropic Models
                </h5>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
                  <li><strong>Claude 3.7 Sonnet</strong> (<code style={{ fontSize: '12px' }}>claude-3-7-sonnet-20250219</code>) - Cutting-edge reasoning & hybrid thinking for complex multi-page apps.</li>
                  <li><strong>Claude 3.5 Sonnet</strong> (<code style={{ fontSize: '12px' }}>claude-3-5-sonnet-20241022</code>) - Recommended standard for web design & component authoring.</li>
                  <li><strong>Claude 3.5 Haiku</strong> (<code style={{ fontSize: '12px' }}>claude-3-5-haiku-20241022</code>) - Ultra-fast responses with 4x lower latency and cost.</li>
                  <li><strong>Claude 3 Opus</strong> (<code style={{ fontSize: '12px' }}>claude-3-opus-20240229</code>) - Highest depth for enterprise architectures.</li>
                </ul>
              </div>

              <h5 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Multi-Turn Conversational Editing</h5>
              <p style={{ color: '#475569', margin: 0 }}>
                You can make continuous modifications naturally:
                <br />• <em>"Change primary accent color to dark navy and emerald"</em>
                <br />• <em>"Add a WhatsApp floating button at bottom right"</em>
                <br />• <em>"Make hero typography larger and add a customer review slider"</em>
                <br />Claude reads the existing CSS/HTML, modifies only the required sections, and keeps your other features intact.
              </p>
            </div>
          )}

          {activeDocTab === 'tools' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '8px' }}>
                Agent Tool Calling Architecture
              </h4>
              <p style={{ color: '#475569', marginBottom: '16px' }}>
                Claude controls project workspace files through secure agent tools:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>create_file</code>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Creates new project files (HTML, CSS, JS, JSON) with full source code.</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>read_file</code>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Reads existing code before editing to guarantee precision and preserve sections.</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>update_file</code>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Updates existing files with surgical refinements and bug fixes.</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>delete_file</code>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Safely deletes obsolete or unwanted files from workspace.</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>run_build</code>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Validates HTML tags, CSS braces, and JavaScript syntax with Node vm engine.</p>
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px', background: '#f8fafc' }}>
                  <code style={{ fontWeight: 700, color: '#2563eb' }}>preview_website</code>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>Triggers sandboxed iframe reload with latest workspace files.</p>
                </div>
              </div>
            </div>
          )}

          {activeDocTab === 'mcp' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '8px' }}>
                Model Context Protocol (MCP) Integration
              </h4>
              <p style={{ color: '#475569', marginBottom: '14px' }}>
                PulseStudio exposes an official Anthropic Model Context Protocol (MCP) server on:
                <br /><code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontSize: '13px' }}>http://localhost:5002/api/mcp/sse</code>
              </p>
              <p style={{ color: '#475569', marginBottom: '14px' }}>
                You can connect external Claude Desktop or Claude Code CLI to generate and refine websites directly from your terminal or desktop client:
              </p>
              <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '14px', borderRadius: '10px', fontSize: '12px', overflowX: 'auto' }}>
{`// claude_desktop_config.json
{
  "mcpServers": {
    "pulse-website-builder": {
      "command": "node",
      "args": ["server/website/mcp-server.js"]
    }
  }
}`}
              </pre>
            </div>
          )}

          {activeDocTab === 'deploy' && (
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 700, marginTop: 0, marginBottom: '8px' }}>
                Export & Production Deployment
              </h4>
              <p style={{ color: '#475569', marginBottom: '14px' }}>
                Every website built in PulseStudio is 100% self-contained and clean HTML5, CSS3, and JavaScript. No npm build or heavy dependencies required.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <strong>1. Download ZIP:</strong> Click <em>Export ZIP</em> in the header to get a clean, ready-to-deploy archive.
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <strong>2. Vercel / Netlify / Cloudflare Pages:</strong> Drag and drop the unzipped folder into Netlify Drop or Vercel dashboard.
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <strong>3. GitHub Pages:</strong> Push to a GitHub repository and turn on Pages under repository settings.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--bg-subtle, #f8fafc)'
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '8px 18px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
}
