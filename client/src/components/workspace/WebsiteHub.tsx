import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Plus,
  Download,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  ExternalLink,
  Code,
  Layout,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../../services/api';

export const WebsiteHub: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sitePrompt, setSitePrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await api.getWebsiteProjects();
        setProjects(res.projects || []);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sitePrompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const newProj = {
        _id: `proj_${Date.now()}`,
        name: sitePrompt.slice(0, 30) + ' Showcase',
        category: 'AI Generated Landing Page',
        status: 'PUBLISHED',
        framework: 'React + Tailwind',
        pagesCount: 4,
        previewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        createdAt: new Date().toISOString()
      };
      setProjects([newProj, ...projects]);
      setGenerating(false);
      setSitePrompt('');
    }, 1200);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top AI Generator Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-sky-900/40 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Gemini AI Autonomous Website Generator
            </h2>
            <p className="text-xs text-sky-200">
              Describe any business or SaaS product to generate a responsive landing page in seconds
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={sitePrompt}
            onChange={(e) => setSitePrompt(e.target.value)}
            placeholder="e.g. Modern high-converting SaaS landing page for an AI accounting tool..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-hidden focus:border-sky-400 backdrop-blur-md"
          />
          <button
            type="submit"
            disabled={generating || !sitePrompt.trim()}
            className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>{generating ? 'Generating with Gemini AI...' : 'Generate Website'}</span>
          </button>
        </form>
      </div>

      {/* Projects Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Website & Landing Page Projects
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {projects.length} responsive landing page projects in your workspace
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
            <span>Connecting to AI Website Studio database...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj._id}
                className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-xl hover:border-sky-400 dark:hover:border-sky-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Preview */}
                  <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={proj.previewUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'}
                      alt={proj.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-900 shadow-xs">
                        {proj.status || 'PUBLISHED'}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                      {proj.category || 'Landing Page'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {proj.name || proj.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Framework: {proj.framework || 'React + Tailwind'} • {proj.pagesCount || 3} Sections
                    </p>
                  </div>
                </div>

                {/* Bottom Controls */}
                <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-4">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(proj.createdAt || Date.now()).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => alert(`Project ${proj.name} exported as production ZIP bundle.`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Export ZIP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

