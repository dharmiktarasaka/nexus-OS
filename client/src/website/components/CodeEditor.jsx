// client/src/components/CodeEditor.jsx
import React, { useState } from 'react';
import { Copy, Check, FileCode, Play, AlertCircle } from 'lucide-react';

export default function CodeEditor({ code = {}, onChange, onApply }) {
  const [activeTab, setActiveTab] = useState('html'); // 'html' | 'css' | 'js'
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = code[activeTab] || '';
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (e) => {
    if (onChange) {
      onChange({
        ...code,
        [activeTab]: e.target.value
      });
    }
  };

  return (
    <div className="code-editor-panel">
      {/* Code Header Tabs */}
      <div className="code-tabs-header">
        <div className="code-tabs-list">
          <button
            className={`code-tab ${activeTab === 'html' ? 'active' : ''}`}
            onClick={() => setActiveTab('html')}
          >
            <span className="dot dot-orange"></span>
            <span>index.html</span>
          </button>
          <button
            className={`code-tab ${activeTab === 'css' ? 'active' : ''}`}
            onClick={() => setActiveTab('css')}
          >
            <span className="dot dot-blue"></span>
            <span>styles.css</span>
          </button>
          <button
            className={`code-tab ${activeTab === 'js' ? 'active' : ''}`}
            onClick={() => setActiveTab('js')}
          >
            <span className="dot dot-yellow"></span>
            <span>script.js</span>
          </button>
        </div>

        <div className="code-actions">
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

      {/* Editor Textarea with Line Numbers simulation */}
      <div className="code-editor-body">
        <textarea
          className="code-textarea"
          value={code[activeTab] || ''}
          onChange={handleTextChange}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          placeholder={`// ${activeTab.toUpperCase()} content...`}
        />
      </div>

      <div className="code-editor-footer">
        <span className="code-meta-info">
          {activeTab.toUpperCase()} • {(code[activeTab] || '').split('\n').length} lines • {((code[activeTab] || '').length / 1024).toFixed(1)} KB
        </span>
        <span className="sync-note">Edits sync directly to live sandboxed frame</span>
      </div>
    </div>
  );
}
