// client/src/pages/EditorPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import DeviceFrame from '../components/DeviceFrame';
import CodeEditor from '../components/CodeEditor';
import { exportProjectToZip } from '../utils/zipExport';
import {
  Sparkles,
  ArrowLeft,
  Download,
  Save,
  Code,
  Eye,
  Columns,
  MessageSquare,
  Globe,
  Check,
  Send,
  Zap
} from 'lucide-react';

const SUGGESTIONS = [
  'Change color theme to deep emerald and gold',
  'Add sticky header announcement banner',
  'Make all buttons have subtle glow on hover',
  'Add an interactive customer testimonial card'
];

export default function EditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/apps/website-builder') ? '/apps/website-builder' : '';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  // Active view: 'split' | 'preview' | 'code'
  const [viewMode, setViewMode] = useState('split');
  // Left panel tab: 'chat' | 'code' | 'seo'
  const [leftTab, setLeftTab] = useState('chat');

  // Working code state
  const [code, setCode] = useState({ html: '', css: '', js: '' });
  const [projectName, setProjectName] = useState('');

  // Mobile split subtab: 'preview' | 'sidebar'
  const [mobileStudioTab, setMobileStudioTab] = useState('preview');

  // AI Refinement chat state
  const [refinePrompt, setRefinePrompt] = useState('');
  const [refining, setRefining] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const fetchProject = async () => {
    setLoading(true);
    try {
      let data = null;
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (res.ok) {
          data = await res.json();
        }
      } catch (e) {
        console.warn('Network call to fetch project deferred:', e.message);
      }

      if (!data) {
        // Fallback to offline projects stored in localStorage
        const localProjects = JSON.parse(localStorage.getItem('pulse_offline_projects') || '[]');
        data = localProjects.find(p => p.id === id);
      }

      if (!data) throw new Error('Project not found');
      setProject(data);
      setProjectName(data.name || 'Untitled Website');
      setCode({
        html: data.html || '',
        css: data.css || '',
        js: data.js || ''
      });

      // Initialize chat history with generation prompt
      const initialHistory = (data.promptHistory || []).map(h => ({
        role: 'user',
        text: h.prompt,
        timestamp: h.timestamp,
        timeString: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      }));
      setChatHistory(initialHistory);
    } catch (err) {
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleManualSave = async () => {
    setSaving(true);
    try {
      try {
        await fetch(`/api/projects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectName,
            html: code.html,
            css: code.css,
            js: code.js
          })
        });
      } catch (e) {
        console.warn('Network save deferred, updating local store:', e.message);
      }

      // Update offline store
      try {
        const localProjects = JSON.parse(localStorage.getItem('pulse_offline_projects') || '[]');
        const idx = localProjects.findIndex(p => p.id === id);
        if (idx !== -1) {
          localProjects[idx] = {
            ...localProjects[idx],
            name: projectName,
            html: code.html,
            css: code.css,
            js: code.js,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem('pulse_offline_projects', JSON.stringify(localProjects));
        }
      } catch (e) {}

      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } catch (err) {
      console.warn('Save notice:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefine = async (customInstruction) => {
    const promptToSend = customInstruction || refinePrompt;
    if (!promptToSend.trim()) return;

    setRefining(true);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      role: 'user',
      text: promptToSend,
      timestamp: new Date().toISOString(),
      timeString: timeStr
    };
    setChatHistory(prev => [...prev, userMsg]);
    setRefinePrompt('');

    try {
      const customKey = localStorage.getItem('gemini_custom_api_key') || '';
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-gemini-key': customKey } : {})
        },
        body: JSON.stringify({
          id,
          currentCode: code,
          prompt: promptToSend
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Refinement failed');
      }

      const refined = await res.json();
      setCode({
        html: refined.html,
        css: refined.css,
        js: refined.js
      });

      const aiMsg = {
        role: 'assistant',
        text: refined.changeSummary || 'Applied requested refinements to HTML, CSS, and JavaScript.',
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatHistory(prev => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        text: 'Error during refinement: ' + err.message,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setChatHistory(prev => [...prev, errorMsg]);
    } finally {
      setRefining(false);
    }
  };

  const handleExportZip = async () => {
    await exportProjectToZip({
      ...project,
      name: projectName,
      html: code.html,
      css: code.css,
      js: code.js
    });
  };

  if (loading) {
    return (
      <div className="studio-loading-screen">
        <div className="spinner"></div>
        <p>Loading Studio Workspace...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="studio-error-screen">
        <h2>Website not found</h2>
        <Link to={`${basePath}`} className="btn-back-dash">Back to Projects</Link>
      </div>
    );
  }

  return (
    <div className="studio-container">
      {/* Studio Header */}
      <header className="studio-header">
        <div className="studio-header-left">
          <Link to={`${basePath}`} className="studio-back-link" title="Return to Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className="title-edit-wrap">
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="studio-title-input"
              title="Click to rename website"
            />
            <span className="studio-badge-cat">{project.category}</span>
          </div>
        </div>

        {/* View Mode Controls */}
        <div className="studio-view-toggles">
          <button
            className={`view-toggle-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Split Studio View"
          >
            <Columns size={15} />
            <span>Split Studio</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => setViewMode('preview')}
            title="Focus Preview View"
          >
            <Eye size={15} />
            <span>Full Preview</span>
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'code' ? 'active' : ''}`}
            onClick={() => setViewMode('code')}
            title="Focus Code View"
          >
            <Code size={15} />
            <span>Full Code</span>
          </button>
        </div>

        {/* Actions Right */}
        <div className="studio-header-right">
          <button
            className={`btn-studio-save ${savedTick ? 'saved' : ''}`}
            onClick={handleManualSave}
            disabled={saving}
          >
            {savedTick ? <Check size={16} /> : <Save size={16} />}
            <span>{savedTick ? 'Saved!' : saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            className="btn-studio-export"
            onClick={handleExportZip}
            title="Download Standalone Production ZIP"
          >
            <Download size={16} />
            <span>Export ZIP</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className={`studio-body mode-${viewMode} mobile-show-${mobileStudioTab}`}>
        {/* Left Studio Inspector / Copilot Panel */}
        {viewMode !== 'preview' && (
          <aside className="studio-sidebar">
            <div className="sidebar-tab-bar">
              <button
                className={`sidebar-tab ${leftTab === 'chat' ? 'active' : ''}`}
                onClick={() => setLeftTab('chat')}
              >
                <MessageSquare size={15} />
                <span>AI Refine</span>
              </button>
              <button
                className={`sidebar-tab ${leftTab === 'code' ? 'active' : ''}`}
                onClick={() => setLeftTab('code')}
              >
                <Code size={15} />
                <span>Code Editor</span>
              </button>
              <button
                className={`sidebar-tab ${leftTab === 'seo' ? 'active' : ''}`}
                onClick={() => setLeftTab('seo')}
              >
                <Globe size={15} />
                <span>SEO & Meta</span>
              </button>
            </div>

            {/* TAB 1: AI Refinement Chat */}
            {leftTab === 'chat' && (
              <div className="refine-chat-view">
                <div className="chat-transcript">
                  <div className="chat-intro-bubble">
                    <Sparkles size={16} className="sparkle-chat" />
                    <div>
                      <strong>AI Website Copilot</strong>
                      <p>Ask for any design or functional change. I will update HTML, CSS, and JS while maintaining working functionality.</p>
                    </div>
                  </div>

                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role} ${msg.isError ? 'err' : ''}`}>
                      <div className="message-content">
                        {msg.text}
                      </div>
                      <span className="message-time">
                        {msg.timeString || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                      </span>
                    </div>
                  ))}

                  {refining && (
                    <div className="chat-message assistant thinking">
                      <div className="message-content">
                        <span className="pulse-text">✨ Gemini is rewriting styles & components...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Suggestion Chips */}
                <div className="suggestion-chips-row">
                  {SUGGESTIONS.map((chip, idx) => (
                    <button
                      key={idx}
                      className="chip-btn"
                      onClick={() => handleRefine(chip)}
                      disabled={refining}
                    >
                      <Zap size={11} />
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="chat-input-bar">
                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder="E.g. Add dark mode toggle or change font to Outfit..."
                    value={refinePrompt}
                    onChange={e => setRefinePrompt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRefine();
                    }}
                    disabled={refining}
                  />
                  <button
                    className="btn-chat-send"
                    onClick={() => handleRefine()}
                    disabled={refining || !refinePrompt.trim()}
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Direct Code Editor */}
            {leftTab === 'code' && (
              <div className="code-editor-view">
                <CodeEditor
                  code={code}
                  onChange={newCode => setCode(newCode)}
                  onApply={handleManualSave}
                />
              </div>
            )}

            {/* TAB 3: SEO & Meta Inspector */}
            {leftTab === 'seo' && (
              <div className="seo-inspector-view">
                <div className="seo-card">
                  <h4 className="seo-heading">Google Search Snippet Preview</h4>
                  <div className="google-preview-box">
                    <span className="google-url">https://{project.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</span>
                    <h5 className="google-title">{project.seo?.title || project.name}</h5>
                    <p className="google-desc">
                      {project.seo?.description || project.tagline || 'Experience award-winning web design.'}
                    </p>
                  </div>
                </div>

                <div className="seo-card">
                  <h4 className="seo-heading">OpenGraph Social Card</h4>
                  <div className="og-preview-box">
                    <div className="og-image-placeholder">
                      <span>Live OG Image Preview</span>
                    </div>
                    <div className="og-meta">
                      <strong>{project.name}</strong>
                      <p>{project.tagline}</p>
                    </div>
                  </div>
                </div>

                <div className="seo-card">
                  <h4 className="seo-heading">JSON-LD Schema Markup</h4>
                  <pre className="schema-json">
                    <code>
                      {JSON.stringify(
                        {
                          '@context': 'https://schema.org',
                          '@type': project.seo?.schemaType || 'Organization',
                          name: project.name,
                          description: project.seo?.description || project.tagline
                        },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Right Stage: Device Frame & Sandboxed Live Preview */}
        {viewMode !== 'code' && (
          <main className="studio-canvas-area">
            <DeviceFrame
              html={code.html}
              css={code.css}
              js={code.js}
              title={projectName}
            />
          </main>
        )}
      </div>

      {/* Floating Mobile Toggle Pill in Split Mode */}
      {viewMode === 'split' && (
        <button
          className="btn-mobile-studio-switch"
          onClick={() => setMobileStudioTab(prev => prev === 'preview' ? 'sidebar' : 'preview')}
          aria-label="Toggle between live preview and copilot tools"
        >
          {mobileStudioTab === 'preview' ? (
            <>
              <MessageSquare size={16} />
              <span>Copilot & Code</span>
            </>
          ) : (
            <>
              <Eye size={16} />
              <span>Live Preview</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
