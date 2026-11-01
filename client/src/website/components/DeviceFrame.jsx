// client/src/components/DeviceFrame.jsx
import React, { useState, useRef, useMemo } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  RefreshCw,
  ExternalLink,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export default function DeviceFrame({ html, css, js, title }) {
  const [device, setDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [isLandscape, setIsLandscape] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [key, setKey] = useState(0); // For forcing iframe refresh
  const iframeRef = useRef(null);

  // Combine HTML, CSS, and JS into a complete self-contained bundle for srcdoc
  const bundledSrcDoc = useMemo(() => {
    if (!html) return '<!DOCTYPE html><html><body><div style="font-family:sans-serif;padding:2rem;color:#888;">No content generated yet.</div></body></html>';

    let doc = html;

    // Inject CSS into <head>
    if (css) {
      const styleTag = `<style id="injected-studio-css">\n${css}\n</style>`;
      if (doc.includes('</head>')) {
        doc = doc.replace('</head>', `${styleTag}\n</head>`);
      } else {
        doc = `${styleTag}\n${doc}`;
      }
    }

    // Inject JS before </body>
    if (js) {
      const scriptTag = `<script id="injected-studio-js">\ntry {\n${js}\n} catch (err) {\n  console.error('[Preview JS Error]', err);\n}\n</script>`;
      if (doc.includes('</body>')) {
        doc = doc.replace('</body>', `${scriptTag}\n</body>`);
      } else {
        doc = `${doc}\n${scriptTag}`;
      }
    }

    return doc;
  }, [html, css, js]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const handleOpenNewTab = () => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(bundledSrcDoc);
      newWindow.document.close();
    }
  };

  // Dimensions
  let width = '100%';
  let height = '100%';

  if (device === 'tablet') {
    width = isLandscape ? '1024px' : '768px';
    height = isLandscape ? '768px' : '960px';
  } else if (device === 'mobile') {
    width = isLandscape ? '812px' : '375px';
    height = isLandscape ? '460px' : '740px';
  }

  return (
    <div className="device-stage-wrapper">
      {/* Top Device Toolbar */}
      <div className="device-toolbar">
        <div className="device-switcher-group">
          <button
            className={`device-btn ${device === 'desktop' ? 'active' : ''}`}
            onClick={() => setDevice('desktop')}
            title="Desktop View (1440px fluid)"
          >
            <Monitor size={16} />
            <span>Desktop</span>
          </button>

          <button
            className={`device-btn ${device === 'tablet' ? 'active' : ''}`}
            onClick={() => setDevice('tablet')}
            title="Tablet View (768px / iPad)"
          >
            <Tablet size={16} />
            <span>Tablet</span>
          </button>

          <button
            className={`device-btn ${device === 'mobile' ? 'active' : ''}`}
            onClick={() => setDevice('mobile')}
            title="Mobile View (375px / iPhone)"
          >
            <Smartphone size={16} />
            <span>Mobile</span>
          </button>
        </div>

        {device !== 'desktop' && (
          <button
            className="tool-btn"
            onClick={() => setIsLandscape(!isLandscape)}
            title="Rotate Orientation"
          >
            <RotateCw size={14} />
            <span>{isLandscape ? 'Landscape' : 'Portrait'}</span>
          </button>
        )}

        <div className="toolbar-divider"></div>

        {/* Zoom Controls */}
        <div className="zoom-group">
          <button
            className="tool-btn icon-only"
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="zoom-text">{Math.round(zoom * 100)}%</span>
          <button
            className="tool-btn icon-only"
            onClick={() => setZoom(prev => Math.min(1.2, prev + 0.1))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        <div className="toolbar-actions-right">
          <button className="tool-btn icon-only" onClick={handleRefresh} title="Reload Preview">
            <RefreshCw size={14} />
          </button>
          <button className="tool-btn" onClick={handleOpenNewTab} title="Open Live in New Tab">
            <ExternalLink size={14} />
            <span>Live Window</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="device-canvas">
        <div
          className={`viewport-shell device-${device} ${isLandscape ? 'landscape' : 'portrait'}`}
          style={{
            width,
            height: device === 'desktop' ? '100%' : height,
            transform: `scale(${zoom})`,
            transformOrigin: 'top center'
          }}
        >
          {device !== 'desktop' && (
            <div className="device-hardware-notch">
              <div className="notch-speaker"></div>
              <div className="notch-camera"></div>
            </div>
          )}
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={bundledSrcDoc}
            title={title || 'Live Website Preview'}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            className="preview-iframe"
          />
        </div>
      </div>
    </div>
  );
}
