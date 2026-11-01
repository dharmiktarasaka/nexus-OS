import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Users,
  Globe,
  TrendingUp,
  Share2,
  Zap,
  ArrowRight,
  PlusCircle,
  Command,
  CornerDownLeft
} from 'lucide-react';
import { api, SearchResult } from '../../services/api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Parent triggers open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res.results || []);
        setSelectedIndex(0);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    navigate(result.url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'crm_lead':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'website_project':
        return <Globe className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'analytics_report':
        return <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'social_post':
        return <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'action':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'marketplace':
        return <PlusCircle className="w-4 h-4 text-slate-400" />;
      default:
        return <Command className="w-4 h-4 text-indigo-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all CRM leads, websites, diagnostic reports, tools..."
            className="flex-1 bg-transparent text-sm md:text-base font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading && (
            <div className="py-8 text-center text-xs font-semibold text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              <span>Searching all integrated applications...</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1 p-1">
              {results.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                    idx === selectedIndex
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
                      {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {item.badge}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                No matching results found for "{query}"
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching for lead names, companies, templates, or report titles.
              </p>
            </div>
          )}

          {!loading && !query && (
            <div className="p-4 space-y-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Shortcuts
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onClose(); navigate('/apps/crm'); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 text-left"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>CRM Leads Pipeline</span>
                </button>
                <button
                  onClick={() => { onClose(); navigate('/apps/website-builder'); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 text-left"
                >
                  <Globe className="w-4 h-4 text-sky-600" />
                  <span>Generate AI Website</span>
                </button>
                <button
                  onClick={() => { onClose(); navigate('/apps/analytics'); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 text-left"
                >
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <span>Business Strategic Stepper</span>
                </button>
                <button
                  onClick={() => { onClose(); navigate('/apps/social'); }}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 text-left"
                >
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Social Post Calendar</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[9px] font-mono">↵</kbd> Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-[9px] font-mono">ESC</kbd> Close
            </span>
          </div>
          <span>Central Federated Search</span>
        </div>
      </div>
    </div>
  );
};

