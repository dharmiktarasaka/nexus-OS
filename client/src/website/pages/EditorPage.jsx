// client/src/website/pages/EditorPage.jsx - AI Coding Agent Studio (Cursor / Bolt.new Style)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import DeviceFrame from '../components/DeviceFrame';
import CodeEditor from '../components/CodeEditor';
import ClaudeLiveConsole from '../components/ClaudeLiveConsole';
import SettingsModal from '../components/SettingsModal';
import DocsModal from '../components/DocsModal';
import TemplatesModal from '../components/TemplatesModal';
import { exportProjectToZip } from '../utils/zipExport';
import { getWebsiteApiUrl } from '../apiConfig';
import { createClientFallbackProject, saveOfflineProject } from '../utils/clientGenerator';
import {
  Sparkles,
  ArrowLeft,
  Download,
  Save,
  Code,
  Eye,
  MessageSquare,
  Globe,
  Check,
  Send,
  Zap,
  Plus,
  FolderTree,
  Settings,
  BookOpen,
  Layout,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  ChevronDown,
  DollarSign,
  Cpu,
  Layers,
  StopCircle,
  FileCode,
  Palette,
  Code2,
  ShieldAlert
} from 'lucide-react';

const SUGGESTIONS = [
  'Change the primary color to dark blue',
  'Add a WhatsApp floating button',
  'Make the website mobile responsive',
  'Add a patient testimonial section'
];

const CLAUDE_MODELS = [
  { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', badge: 'Reasoning' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'Standard' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: 'Fast / Low Cost' },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', badge: 'Deep' }
];

export default function EditorPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = location.pathname.startsWith('/apps/website-builder') ? '/apps/website-builder' : '';

  // Project state
  const [project, setProject] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [projectName, setProjectName] = useState('');

  // Workspace files & code state
  const [files, setFiles] = useState([]);
  const [code, setCode] = useState({ html: '', css: '', js: '' });

  // Agent Chat & SSE Streaming state
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [activeTools, setActiveTools] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');
  const [tokenUsage, setTokenUsage] = useState({ promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUSD: 0 });
  const [buildStatus, setBuildStatus] = useState({ status: 'clean', errors: [] });

  // UI Navigation Tabs
  // Right Stage Tab: 'preview' | 'code' | 'build' | 'seo'
  const [rightTab, setRightTab] = useState('preview');
  const [liveToast, setLiveToast] = useState(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  // References
  const chatScrollRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, streamingText, activeTools]);

  // Fetch Project & User's Projects List
  const fetchProjectAndList = async () => {
    setLoading(true);
    try {
      // 1. Fetch user projects for left sidebar
      try {
        const listRes = await fetch(getWebsiteApiUrl('/api/projects'));
        if (listRes.ok) {
          const listJson = await listRes.json();
          if (Array.isArray(listJson)) {
            setProjectsList(listJson);
          }
        }
      } catch (_e) {}

      // 2. Fetch specific project data
      let data = null;
      try {
        const res = await fetch(getWebsiteApiUrl(`/api/projects/${id}`));
        if (res.ok) {
          const json = await res.json();
          if (json && !Array.isArray(json) && (json.id || json._id || json.html)) {
            data = json;
          }
        }
      } catch (_e) {}

      if (!data || !data.html) {
        // Fallback to offline storage
        const localProjects = JSON.parse(localStorage.getItem('pulse_offline_projects') || '[]');
        const found = localProjects.find(p => p.id === id || p._id === id);
        if (found) data = found;
      }

      // If still missing, synthesize initial project
      if (!data || !data.html) {
        const promptText = (data && data.prompt) ? data.prompt : 'Modern Interactive Business Studio';
        const category = (data && data.category) ? data.category : 'general';
        data = createClientFallbackProject(promptText, category, null, null);
        data.id = id;
        saveOfflineProject(data);
      }

      setProject(data);
      setProjectName(data.name || 'Modern Website Studio');
      if (data.model) setSelectedModel(data.model);
      if (data.tokenUsage) setTokenUsage(data.tokenUsage);
      if (data.buildErrors) setBuildStatus({ status: data.buildErrors.length === 0 ? 'clean' : 'has_errors', errors: data.buildErrors });

      // Initialize Files
      let projectFiles = data.files;
      if (!Array.isArray(projectFiles) || projectFiles.length === 0) {
        projectFiles = [
          { path: 'index.html', content: data.html || '', language: 'html' },
          { path: 'styles.css', content: data.css || '', language: 'css' },
          { path: 'script.js', content: data.js || '', language: 'javascript' }
        ];
      }
      setFiles(projectFiles);

      // Initialize legacy code for iframe
      setCode({
        html: data.html || projectFiles.find(f => f.path === 'index.html')?.content || '',
        css: data.css || projectFiles.find(f => f.path === 'styles.css')?.content || '',
        js: data.js || projectFiles.find(f => f.path === 'script.js')?.content || ''
      });

      // Initialize Conversation
      if (Array.isArray(data.conversation) && data.conversation.length > 0) {
        setConversation(data.conversation);
      } else if (Array.isArray(data.promptHistory) && data.promptHistory.length > 0) {
        const converted = [];
        data.promptHistory.forEach(h => {
          converted.push({ role: 'user', content: h.prompt, timestamp: h.timestamp });
          if (h.changeSummary) {
            converted.push({ role: 'assistant', content: h.changeSummary, timestamp: h.timestamp });
          }
        });
        setConversation(converted);
      } else if (data.prompt) {
        setConversation([
          { role: 'user', content: data.prompt, timestamp: new Date().toISOString() },
          { role: 'assistant', content: `Created initial website for "${data.prompt}". You can modify anything using natural language!`, timestamp: new Date().toISOString() }
        ]);
      }
    } catch (err) {
      console.error('Error loading project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndList();
  }, [id]);

  // Real-time EventSource listener
  useEffect(() => {
    let evt = null;
    try {
      evt = new EventSource(getWebsiteApiUrl('/api/projects/live-stream'));
      evt.onmessage = (e) => {
        try {
          const streamData = JSON.parse(e.data);
          if (streamData.type === 'PROJECT_EVENT' && streamData.projectId === id && streamData.project) {
            const p = streamData.project;
            if (p.files && Array.isArray(p.files)) setFiles(p.files);
            if (p.html || p.css || p.js) {
              setCode({
                html: p.html || '',
                css: p.css || '',
                js: p.js || ''
              });
            }
            if (p.name) setProjectName(p.name);
            setLiveToast('⚡ Claude MCP synchronized website canvas in real-time!');
            setTimeout(() => setLiveToast(null), 4000);
          }
        } catch (_err) {}
      };
    } catch (_e) {}

    return () => {
      if (evt) evt.close();
    };
  }, [id]);

  // Stop Generation Handler
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    if (streamingText) {
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: streamingText + ' [Generation stopped by user]'
        }
      ]);
      setStreamingText('');
    }
    setActiveTools([]);
  };

  // Main Anthropic Claude Agent Prompt Execution via Server-Sent Events
  const handleSendPrompt = async (overridePrompt) => {
    const promptToSend = (overridePrompt || promptInput).trim();
    if (!promptToSend || isGenerating) return;

    setPromptInput('');
    setIsGenerating(true);
    setStreamingText('');
    setActiveTools([]);

    // Add user message to conversation history
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toISOString()
    };
    setConversation(prev => [...prev, userMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const modifiedFilesSet = new Set();
    let accumulatedText = '';

    try {
      const customKey = localStorage.getItem('anthropic_custom_api_key') || '';
      const response = await fetch(getWebsiteApiUrl('/api/agent/chat/stream'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customKey ? { 'x-anthropic-key': customKey } : {})
        },
        body: JSON.stringify({
          projectId: id,
          prompt: promptToSend,
          model: selectedModel,
          anthropicKey: customKey || undefined
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line

        let currentEvent = 'message';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (!rawData) continue;

            try {
              const data = JSON.parse(rawData);

              if (currentEvent === 'token') {
                if (data.text) {
                  accumulatedText += data.text;
                  setStreamingText(accumulatedText);
                }
              } else if (currentEvent === 'tool_call') {
                setActiveTools(prev => [
                  ...prev,
                  {
                    id: data.id,
                    tool: data.tool,
                    input: data.input,
                    status: 'running'
                  }
                ]);
              } else if (currentEvent === 'tool_result') {
                setActiveTools(prev =>
                  prev.map(t =>
                    t.id === data.id
                      ? { ...t, status: data.output?.error ? 'error' : 'success', output: data.output }
                      : t
                  )
                );
              } else if (currentEvent === 'file_changed') {
                modifiedFilesSet.add(data.path);
                // Update local files list
                setFiles(prevFiles => {
                  const existingIdx = prevFiles.findIndex(f => f.path === data.path);
                  if (data.action === 'delete') {
                    return prevFiles.filter(f => f.path !== data.path);
                  }
                  if (existingIdx !== -1) {
                    const next = [...prevFiles];
                    next[existingIdx] = {
                      ...next[existingIdx],
                      updatedAt: new Date()
                    };
                    return next;
                  }
                  return [...prevFiles, { path: data.path, language: data.language || 'text', updatedAt: new Date() }];
                });
              } else if (currentEvent === 'build_status') {
                setBuildStatus({
                  status: data.status,
                  errors: data.errors || []
                });
              } else if (currentEvent === 'stats') {
                setTokenUsage({
                  promptTokens: data.promptTokens,
                  completionTokens: data.completionTokens,
                  totalTokens: data.totalTokens,
                  estimatedCostUSD: data.estimatedCostUSD
                });
              } else if (currentEvent === 'done') {
                if (data.project) {
                  const p = data.project;
                  setProject(prev => ({ ...prev, ...p }));
                  if (p.files && Array.isArray(p.files)) setFiles(p.files);
                  setCode({
                    html: p.html || '',
                    css: p.css || '',
                    js: p.js || ''
                  });
                }
              } else if (currentEvent === 'error') {
                throw new Error(data.message || 'Claude agent reported an error');
              }
            } catch (jsonErr) {
              console.warn('[SSE Parse]', jsonErr);
            }
          }
        }
      }

      // Turn completed
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: accumulatedText || 'Website updated successfully.',
        filesModified: Array.from(modifiedFilesSet),
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, assistantMsg]);
      setStreamingText('');
      setActiveTools([]);

      // Fetch fresh project files to keep state fully in sync
      try {
        const refreshRes = await fetch(getWebsiteApiUrl(`/api/projects/${id}/files`));
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          if (freshData.files) setFiles(freshData.files);
          if (freshData.html || freshData.css || freshData.js) {
            setCode({
              html: freshData.html || '',
              css: freshData.css || '',
              js: freshData.js || ''
            });
          }
        }
      } catch (_e) {}
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Claude Agent Error:', err);
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${err.message}`,
        isError: true,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMsg]);
    } finally {
      setIsGenerating(false);
      setStreamingText('');
      setActiveTools([]);
      abortControllerRef.current = null;
    }
  };

  // Manual Save to MongoDB
  const handleManualSave = async () => {
    setSaving(true);
    try {
      await fetch(getWebsiteApiUrl(`/api/projects/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          files,
          html: code.html,
          css: code.css,
          js: code.js,
          model: selectedModel
        })
      });
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    } catch (err) {
      console.warn('Save notice:', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Manual Code Editor Changes
  const handleCodeChange = (updatedFilesOrCode) => {
    if (Array.isArray(updatedFilesOrCode)) {
      setFiles(updatedFilesOrCode);
      const htmlF = updatedFilesOrCode.find(f => f.path === 'index.html');
      const cssF = updatedFilesOrCode.find(f => f.path === 'styles.css');
      const jsF = updatedFilesOrCode.find(f => f.path === 'script.js');
      setCode({
        html: htmlF?.content ?? code.html,
        css: cssF?.content ?? code.css,
        js: jsF?.content ?? code.js
      });
    } else {
      setCode(updatedFilesOrCode);
    }
  };

  const handleAddFile = (newPath) => {
    const ext = newPath.split('.').pop() || 'html';
    const newFile = { path: newPath, content: '', language: ext, updatedAt: new Date() };
    setFiles(prev => [...prev, newFile]);
  };

  // Duplicate Project
  const handleDuplicateProject = async () => {
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${id}/duplicate`), { method: 'POST' });
      if (res.ok) {
        const dup = await res.json();
        navigate(`${basePath}/editor/${dup.id}`);
      }
    } catch (err) {
      alert('Duplicate failed: ' + err.message);
    }
  };

  // Run Build Diagnostics
  const handleRunBuildCheck = async () => {
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${id}/build`), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBuildStatus({ status: data.status, errors: data.errors });
      }
    } catch (err) {
      console.warn('Build check failed:', err.message);
    }
  };

  // Download ZIP
  const handleExportZip = async () => {
    await exportProjectToZip({
      ...project,
      name: projectName,
      files,
      html: code.html,
      css: code.css,
      js: code.js
    });
  };

  if (loading) {
    return (
      <div className="studio-loading-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <div className="spinner"></div>
        <p style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Loading AI Coding Agent Studio...</p>
      </div>
    );
  }

  return (
    <div className="studio-3panel-container">
      {/* =========================================================================
          TOP STUDIO HEADER BAR
         ========================================================================= */}
      <header className="studio-3panel-header">
        {/* Left: Back & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to={`${basePath}`} className="studio-back-link" title="Return to Dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
            <ArrowLeft size={18} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              className="studio-title-input"
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--text-main)'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-medium)'}
              onBlur={e => {
                e.target.style.borderColor = 'transparent';
                handleManualSave();
              }}
              title="Click to rename website"
            />
            <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
              {project?.category || 'general'}
            </span>
          </div>
        </div>

        {/* Center: Model Selector & Live Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '4px 10px' }}>
            <Sparkles size={14} color="#d97706" />
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {CLAUDE_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.badge})
                </option>
              ))}
            </select>
          </div>

          {/* Token Usage & Cost Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '5px 10px' }} title="Cumulative Token Consumption & Estimated Anthropic Cost">
            <DollarSign size={13} color="#10b981" />
            <span>${(tokenUsage.estimatedCostUSD || 0).toFixed(4)}</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>{(tokenUsage.totalTokens || 0).toLocaleString()} tok</span>
          </div>
        </div>

        {/* Right Actions: Save, Duplicate, Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className={`btn-studio-save ${savedTick ? 'saved' : ''}`}
            onClick={handleManualSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: savedTick ? '#10b981' : 'var(--bg-surface)',
              color: savedTick ? '#ffffff' : 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {savedTick ? <Check size={14} /> : <Save size={14} />}
            <span>{savedTick ? 'Saved' : saving ? 'Saving...' : 'Save'}</span>
          </button>

          <button
            onClick={handleDuplicateProject}
            title="Duplicate Project Workspace"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Layers size={14} />
            <span>Duplicate</span>
          </button>

          <button
            className="btn-studio-export"
            onClick={handleExportZip}
            title="Download Standalone Production ZIP"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>Export ZIP</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          3-PANEL STUDIO BODY
         ========================================================================= */}
      <div className="studio-3panel-body">
        {/* =====================================================================
            PANEL 1: LEFT SIDEBAR
           ===================================================================== */}
        <aside className="panel-left-sidebar">
          {/* New Project Button */}
          <div className="sidebar-section">
            <Link
              to={`${basePath}/new`}
              className="sidebar-btn sidebar-btn-primary"
            >
              <Plus size={16} />
              <span>New Project</span>
            </Link>
          </div>

          {/* Project Workspace Files Tree */}
          <div className="sidebar-section" style={{ flex: 1 }}>
            <div className="sidebar-label">
              <FolderTree size={13} />
              <span>Workspace Files ({files.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {files.map(f => {
                const isHtml = f.path.endsWith('.html');
                const isCss = f.path.endsWith('.css');
                const isJs = f.path.endsWith('.js');
                return (
                  <button
                    key={f.path}
                    className="sidebar-btn"
                    onClick={() => {
                      setRightTab('code');
                    }}
                    style={{ justifyContent: 'space-between' }}
                    title={`Open ${f.path} in Code Editor`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isHtml && <FileCode size={14} color="#f97316" />}
                      {isCss && <Palette size={14} color="#38bdf8" />}
                      {isJs && <Code2 size={14} color="#facc15" />}
                      {!isHtml && !isCss && !isJs && <Code size={14} color="#94a3b8" />}
                      <span style={{ fontSize: '12.5px' }}>{f.path}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {((f.content?.length || 0) / 1024).toFixed(1)}k
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent User Projects Switcher */}
          {projectsList.length > 0 && (
            <div className="sidebar-section" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <div className="sidebar-label">
                <Layers size={13} />
                <span>My Projects ({projectsList.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {projectsList.slice(0, 5).map(p => (
                  <Link
                    key={p.id}
                    to={`${basePath}/editor/${p.id}`}
                    className={`sidebar-btn ${p.id === id ? 'active' : ''}`}
                    style={{ fontSize: '12px', padding: '6px 8px', textDecoration: 'none' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Sidebar Bottom Nav: Templates, Settings, Docs */}
          <div className="sidebar-section" style={{ borderBottom: 'none' }}>
            <button className="sidebar-btn" onClick={() => setIsTemplatesOpen(true)}>
              <Layout size={15} color="#2563eb" />
              <span>Website Templates</span>
            </button>
            <button className="sidebar-btn" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={15} color="#d97706" />
              <span>API Configuration</span>
            </button>
            <button className="sidebar-btn" onClick={() => setIsDocsOpen(true)}>
              <BookOpen size={15} color="#059669" />
              <span>Documentation</span>
            </button>
          </div>
        </aside>

        {/* =====================================================================
            PANEL 2: CENTER WORKSPACE (AI CHATBOT & CODING AGENT)
           ===================================================================== */}
        <section className="panel-center-chat">
          {/* Chat Header Bar */}
          <div className="chat-header-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isGenerating ? '#f59e0b' : '#10b981', boxShadow: isGenerating ? '0 0 8px #f59e0b' : '0 0 8px #10b981' }}></div>
              <strong style={{ fontSize: '13px' }}>Claude Coding Agent</strong>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isGenerating ? 'Active turn executing...' : 'Ready for instruction'}
            </span>
          </div>

          {/* Chat Stream History */}
          <div className="chat-stream-container" ref={chatScrollRef}>
            {/* Intro Welcome Card */}
            <div style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Sparkles size={18} color="#d97706" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                  Anthropic Claude AI Website Builder
                </strong>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  Give any natural language prompt. Claude plans architecture, generates actual project code, uses controlled file tools (<code style={{ fontSize: '11px' }}>create_file</code>, <code style={{ fontSize: '11px' }}>update_file</code>), and updates the live site.
                </p>
              </div>
            </div>

            {/* Conversation Messages */}
            {conversation.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                {msg.role === 'user' ? (
                  <div className="chat-bubble-user">
                    {msg.content}
                  </div>
                ) : (
                  <div className={`chat-bubble-assistant ${msg.isError ? 'err' : ''}`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>

                    {/* File Modification Badges */}
                    {Array.isArray(msg.filesModified) && msg.filesModified.length > 0 && (
                      <div className="file-mod-chips-row">
                        {msg.filesModified.map(filePath => (
                          <span key={filePath} className="file-mod-chip">
                            <Check size={11} />
                            <span>{filePath}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Live Active Turn Streaming Text */}
            {streamingText && (
              <div className="chat-bubble-assistant">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {streamingText}
                </div>
              </div>
            )}

            {/* Live Tool Calling Cards */}
            {activeTools.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeTools.map(t => (
                  <div key={t.id} className="tool-call-card">
                    <div className="tool-call-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Wrench size={13} />
                        <span>{t.tool}</span>
                        {t.input?.path && <code style={{ color: 'var(--text-main)' }}>"{t.input.path}"</code>}
                      </div>
                      <span className={`tool-call-status-pill ${t.status === 'running' ? 'tool-call-status-running' : ''}`}>
                        {t.status === 'running' ? 'Executing...' : 'Completed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div style={{ padding: '6px 14px', display: 'flex', gap: '6px', overflowX: 'auto', background: 'var(--bg-surface-alt)', borderTop: '1px solid var(--border-subtle)' }}>
            {SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                className="chip-btn"
                onClick={() => handleSendPrompt(chip)}
                disabled={isGenerating}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <Zap size={10} color="#d97706" />
                <span>{chip}</span>
              </button>
            ))}
          </div>

          {/* Prompt Composer */}
          <div className="chat-composer-box">
            <textarea
              className="chat-textarea-field"
              placeholder="Ask Claude to create or modify features, e.g. 'Build a modern dental clinic website'..."
              value={promptInput}
              onChange={e => setPromptInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendPrompt();
                }
              }}
              disabled={isGenerating}
              rows={2}
            />

            <div className="composer-toolbar">
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Press <kbd style={{ background: 'var(--bg-surface-alt)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>Enter</kbd> to send, <kbd style={{ background: 'var(--bg-surface-alt)', padding: '2px 5px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>Shift+Enter</kbd> for line
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isGenerating ? (
                  <button
                    onClick={handleStopGeneration}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #ef4444',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <StopCircle size={14} />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    className="btn-chat-send"
                    onClick={() => handleSendPrompt()}
                    disabled={!promptInput.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: promptInput.trim() ? 'pointer' : 'not-allowed',
                      opacity: promptInput.trim() ? 1 : 0.5
                    }}
                  >
                    <Send size={13} />
                    <span>Send</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            PANEL 3: RIGHT WORKSPACE (LIVE PREVIEW, CODE EDITOR, BUILD CHECKS)
           ===================================================================== */}
        <main className="panel-right-stage">
          {/* Stage Tabs Navigation Strip */}
          <div className="stage-tab-strip">
            <div className="stage-tabs-list">
              <button
                className={`stage-tab-btn ${rightTab === 'preview' ? 'active' : ''}`}
                onClick={() => setRightTab('preview')}
              >
                <Eye size={14} />
                <span>Live Preview</span>
              </button>
              <button
                className={`stage-tab-btn ${rightTab === 'code' ? 'active' : ''}`}
                onClick={() => setRightTab('code')}
              >
                <Code size={14} />
                <span>Code Editor ({files.length})</span>
              </button>
              <button
                className={`stage-tab-btn ${rightTab === 'build' ? 'active' : ''}`}
                onClick={() => setRightTab('build')}
              >
                {buildStatus.status === 'clean' ? <CheckCircle2 size={14} color="#10b981" /> : <AlertTriangle size={14} color="#f59e0b" />}
                <span>Build & Diagnostics</span>
              </button>
              <button
                className={`stage-tab-btn ${rightTab === 'seo' ? 'active' : ''}`}
                onClick={() => setRightTab('seo')}
              >
                <Globe size={14} />
                <span>SEO Preview</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={getWebsiteApiUrl(`/api/preview/${id}`)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  textDecoration: 'none'
                }}
              >
                <span>Standalone URL</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Stage Tab Content */}
          <div className="stage-content-area">
            {/* TAB 1: Live Sandboxed Website Preview */}
            {rightTab === 'preview' && (
              <DeviceFrame
                html={code.html}
                css={code.css}
                js={code.js}
                title={projectName}
              />
            )}

            {/* TAB 2: Multi-File Code Editor */}
            {rightTab === 'code' && (
              <CodeEditor
                files={files}
                code={code}
                onChange={handleCodeChange}
                onApply={handleManualSave}
                onAddFile={handleAddFile}
              />
            )}

            {/* TAB 3: Build & Syntax Diagnostics */}
            {rightTab === 'build' && (
              <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 700 }}>
                      Project Build Diagnostics
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      Automated syntax validation across all HTML markup, CSS stylesheet rules, and JavaScript scripts.
                    </p>
                  </div>
                  <button
                    onClick={handleRunBuildCheck}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-main)',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCw size={14} />
                    <span>Re-Run Diagnostics</span>
                  </button>
                </div>

                {buildStatus.errors.length === 0 ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: '14px', padding: '20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <CheckCircle2 size={24} color="#10b981" />
                    <div>
                      <strong style={{ color: '#065f46', fontSize: '15px' }}>Build Passed Cleanly (0 Errors)</strong>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#047857' }}>
                        All {files.length} project workspace files compiled with valid HTML5 tags, CSS braces, and JavaScript syntax.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertTriangle size={20} color="#ef4444" />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#b91c1c' }}>
                        Found {buildStatus.errors.length} build error(s). Ask Claude: "Fix build errors" to resolve automatically.
                      </span>
                    </div>

                    {buildStatus.errors.map((err, idx) => (
                      <div key={idx} style={{ background: 'var(--bg-surface-alt)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>[{err.severity.toUpperCase()}]</span>
                          <code style={{ fontSize: '12px', fontWeight: 600 }}>{err.file}:{err.line}</code>
                        </div>
                        <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-main)', fontFamily: 'monospace' }}>
                          {err.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: SEO Inspector */}
            {rightTab === 'seo' && (
              <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '17px', fontWeight: 700 }}>
                  Search Engine & OpenGraph Metadata
                </h3>

                <div className="seo-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700 }}>Google Snippet Preview</h4>
                  <div style={{ background: 'var(--bg-surface-alt)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#15803d' }}>https://{projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com</span>
                    <h5 style={{ margin: '2px 0 4px 0', fontSize: '16px', color: '#1d4ed8' }}>{project?.seo?.metaTitle || projectName}</h5>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                      {project?.seo?.metaDescription || project?.tagline || 'Modern AI engineered website crafted with PulseStudio and real Anthropic Claude API.'}
                    </p>
                  </div>
                </div>

                <div className="seo-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '16px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700 }}>Structured Data (JSON-LD)</h4>
                  <pre style={{ background: 'var(--bg-surface-alt)', padding: '12px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto' }}>
                    <code>
                      {JSON.stringify(
                        {
                          '@context': 'https://schema.org',
                          '@type': project?.seo?.schemaType || 'Organization',
                          name: projectName,
                          description: project?.tagline || ''
                        },
                        null,
                        2
                      )}
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Claude MCP Real-time Console */}
      <ClaudeLiveConsole currentProjectId={id} onProjectUpdated={fetchProjectAndList} />

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={(tplPrompt) => handleSendPrompt(tplPrompt)}
      />

      {/* Floating Live Toast Notification */}
      {liveToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid #10b981',
            borderRadius: '14px',
            padding: '12px 20px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <span>✨</span>
          <span>{liveToast}</span>
        </div>
      )}
    </div>
  );
}
