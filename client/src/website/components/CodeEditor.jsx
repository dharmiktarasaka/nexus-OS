// client/src/website/components/CodeEditor.jsx - Multi-File Workspace Code Editor
import React, { useState, useMemo } from 'react';
import { Copy, Check, FileCode, Play, Plus, Trash2, FileText, Code2, Palette } from 'lucide-react';

export default function CodeEditor({ code = {}, files = [], onChange, onApply, onAddFile, onDeleteFile }) {
  // Support both multi-file array or legacy code { html, css, js }
  const effectiveFiles = useMemo(() => {
    if (Array.isArray(files) && files.length > 0) {
      return files;
    }
    return [
      { path: 'index.html', content: code.html || '', language: 'html' },
      { path: 'styles.css', content: code.css || '', language: 'css' },
      { path: 'script.js', content: code.js || '', language: 'javascript' }
    ];
  }, [files, code]);

  const [activeFilePath, setActiveFilePath] = useState(effectiveFiles[0]?.path || 'index.html');
  const [copied, setCopied] = useState(false);
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const activeFile = effectiveFiles.find(f => f.path === activeFilePath) || effectiveFiles[0];
  const activeContent = activeFile?.content || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (e) => {
    const newContent = e.target.value;
    if (Array.isArray(files) && files.length > 0 && onChange) {
      const updatedFiles = files.map(f =>
        f.path === activeFile.path ? { ...f, content: newContent, updatedAt: new Date() } : f
      );
      onChange(updatedFiles);
    } else if (onChange) {
      // Legacy code map
      const legacyKey = activeFile.path === 'index.html' ? 'html' : activeFile.path === 'styles.css' ? 'css' : 'js';
      onChange({
        ...code,
        [legacyKey]: newContent
      });
    }
  };

  const handleCreateFileSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const cleanPath = newFileName.trim().replace(/\\/g, '/').replace(/^\/+/, '');
    if (onAddFile) {
      onAddFile(cleanPath);
      setActiveFilePath(cleanPath);
    }
    setNewFileName('');
    setIsAddingFile(false);
  };

  const getFileIcon = (filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.htm')) return <FileCode size={13} color="#f97316" />;
    if (filePath.endsWith('.css')) return <Palette size={13} color="#38bdf8" />;
    if (filePath.endsWith('.js')) return <Code2 size={13} color="#facc15" />;
    return <FileText size={13} color="#94a3b8" />;
  };

  return (
    <div className="code-editor-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Code Header Tabs */}
      <div className="code-tabs-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div className="code-tabs-list" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', maxWidth: '80%' }}>
          {effectiveFiles.map(f => (
            <button
              key={f.path}
              className={`code-tab ${activeFilePath === f.path ? 'active' : ''}`}
              onClick={() => setActiveFilePath(f.path)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {getFileIcon(f.path)}
              <span>{f.path}</span>
            </button>
          ))}

          {onAddFile && !isAddingFile && (
            <button
              className="code-tab add-file-tab"
              onClick={() => setIsAddingFile(true)}
              title="Add new file"
              style={{ padding: '4px 8px' }}
            >
              <Plus size={13} />
            </button>
          )}

          {isAddingFile && (
            <form onSubmit={handleCreateFileSubmit} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                autoFocus
                placeholder="filename.html"
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                onBlur={() => setIsAddingFile(false)}
                style={{
                  background: 'var(--bg-subtle, #1e293b)',
                  color: 'inherit',
                  border: '1px solid #3b82f6',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  fontSize: '12px'
                }}
              />
            </form>
          )}
        </div>

        <div className="code-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button className="code-action-btn" onClick={handleCopy} title="Copy file content">
            {copied ? <Check size={14} className="text-green" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {onApply && (
            <button className="code-action-btn btn-apply" onClick={onApply} title="Apply edits to live preview">
              <Play size={14} />
              <span>Apply Sync</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Textarea with syntax feel */}
      <div className="code-editor-body" style={{ flex: 1, minHeight: 0 }}>
        <textarea
          className="code-textarea"
          value={activeContent}
          onChange={handleTextChange}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder={`// ${activeFilePath} source code...`}
          style={{ width: '100%', height: '100%', resize: 'none', fontFamily: 'monospace' }}
        />
      </div>

      <div className="code-editor-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px' }}>
        <span className="code-meta-info" style={{ fontSize: '11px', color: '#64748b' }}>
          {activeFilePath} • {activeContent.split('\n').length} lines • {(activeContent.length / 1024).toFixed(1)} KB
        </span>
        <span className="sync-note" style={{ fontSize: '11px', color: '#10b981' }}>
          ● Live synced to preview sandbox
        </span>
      </div>
    </div>
  );
}
