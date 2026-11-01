import React, { useState, useRef } from 'react';
import {
  ExternalLink,
  RotateCw,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutGrid
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { AppModule } from '../../services/api';

interface WorkspaceContainerProps {
  module: AppModule;
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabs?: Array<{ id: string; label: string }>;
}

export const WorkspaceContainer: React.FC<WorkspaceContainerProps> = ({
  module,
  children,
  activeTab,
  onTabChange,
  tabs = []
}) => {
  const [viewMode, setViewMode] = useState<'hub' | 'embedded'>('hub');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const handleReload = () => {
    setIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(module.defaultUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-slate-50 dark:bg-slate-950 ${
        isFullscreen ? 'p-4 bg-slate-900 z-50 fixed inset-0' : ''
      }`}
    >
      {/* Workspace Header Toolbar */}
      <div className="px-4 md:px-6 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        {/* Left: Breadcrumbs & App Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <NavLink
            to="/"
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Return to Central Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </NavLink>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Workspace</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {module.name}
            </span>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
            <span>Connected & Live</span>
          </div>
        </div>

        {/* Right: Mode Switcher & Tools */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Dual Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setViewMode('hub')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'hub'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Native Fast Hub</span>
            </button>

            <button
              onClick={() => setViewMode('embedded')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'embedded'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Application View</span>
            </button>
          </div>

          {/* Controls */}
          {viewMode === 'embedded' && (
            <button
              onClick={handleReload}
              title="Reload embedded app"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleOpenExternal}
            title="Open in independent browser tab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <span className="hidden lg:inline">Independent Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Expand full workspace'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sub Tabs Bar (for Hub mode) */}
      {viewMode === 'hub' && tabs.length > 0 && (
        <div className="px-6 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => onTabChange?.(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'hub' ? (
          children
        ) : (
          <div className="relative w-full h-full bg-slate-100 dark:bg-slate-950 flex flex-col">
            {iframeLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs gap-3">
                <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Connecting to live {module.name} instance ({module.defaultUrl})...
                </p>
                <p className="text-[11px] text-slate-400">
                  All features, workflows, and database records preserved.
                </p>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={module.defaultUrl}
              onLoad={() => setIframeLoading(false)}
              onError={() => setIframeLoading(false)}
              className="w-full h-full border-none flex-1"
              title={module.name}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        )}
      </div>
    </div>
  );
};

