import React from 'react';
import { Sparkles, Calendar, ArrowUpRight, Zap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';

interface WelcomeBannerProps {
  onQuickAction: (route: string) => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onQuickAction }) => {
  const { user } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  // Dynamic greeting based on current local hour
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 md:p-8 shadow-xl border border-indigo-800/40">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-60 h-60 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>{today}</span>
            <span className="w-1 h-1 rounded-full bg-white/40" />
            <span className="text-white/80">{currentWorkspace.name}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {greeting}, {user?.displayName || 'Executive'}
          </h1>
          <p className="text-sm text-slate-300 font-normal leading-relaxed">
            Welcome to your centralized business operating system. All 4 core enterprise modules are synchronized with real-time database intelligence.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onQuickAction('/apps/crm')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-all shadow-md shadow-black/20 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>CRM Pipeline</span>
          </button>

          <button
            onClick={() => onQuickAction('/apps/website-builder')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-sky-300" />
            <span>Generate Website</span>
          </button>

          <button
            onClick={() => onQuickAction('/apps/analytics')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            <span>Run Diagnostic</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};

