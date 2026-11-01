import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Share2,
  Globe,
  TrendingUp,
  Star,
  ExternalLink,
  ArrowRight,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

interface AppCardsGridProps {
  stats: any;
  recentActivity: any[];
}

export const AppCardsGrid: React.FC<AppCardsGridProps> = ({ stats, recentActivity }) => {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite, recordAppAccess } = useWorkspace();

  const apps = [
    {
      id: 'crm',
      slug: 'crm',
      name: 'CRM Management',
      shortName: 'Personal Leads CRM',
      description: 'Lead generation, Excel import/export pipelines, web/Maps scraping, and deal status Kanban tracking.',
      icon: Users,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      tagline: 'Sales Pipeline & Outreach',
      statText: `${stats?.crm?.totalLeads || 42} Active Leads • ${stats?.crm?.qualifiedLeads || 18} Qualified`,
      recentEvent: recentActivity.find(a => a.appId === 'crm')?.title || 'New Lead: Apex Technologies ($18,500)',
      lastAccessed: '12m ago',
      features: ['Lead Scraper', 'Excel Import', 'Kanban Board']
    },
    {
      id: 'social',
      slug: 'social',
      name: 'Social Media Management',
      shortName: 'Mediamation',
      description: 'Multi-account social media management, AI caption/hashtag creation, calendar scheduling, and automated publishing.',
      icon: Share2,
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      tagline: 'Autonomous Social Publisher',
      statText: `${stats?.social?.totalPosts || 38} Total Posts • ${stats?.social?.scheduledPosts || 7} In Queue`,
      recentEvent: recentActivity.find(a => a.appId === 'social')?.title || 'Scheduled Carousel: "5 SaaS Scaling Metrics"',
      lastAccessed: '45m ago',
      features: ['AI Captions', 'Instagram & FB', 'Post Scheduler']
    },
    {
      id: 'website-builder',
      slug: 'website-builder',
      name: 'Website & Landing Page Builder',
      shortName: 'AI Website Studio',
      description: 'Gemini AI website generation, high-converting landing page creator, live responsive preview, and 1-click ZIP export.',
      icon: Globe,
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      tagline: 'Gemini Site Generation & Editor',
      statText: `${stats?.website?.totalProjects || 16} Projects • ${stats?.website?.publishedSites || 12} Published`,
      recentEvent: recentActivity.find(a => a.appId === 'website-builder')?.title || 'Generated: NovaPay NeoBanking Page',
      lastAccessed: '2h ago',
      features: ['Gemini AI Engine', 'Live Code Editor', 'Clean ZIP Export']
    },
    {
      id: 'analytics',
      slug: 'analytics',
      name: 'Business Analytics',
      shortName: 'STRATIQ Advisor',
      description: 'Four operational pillars business intake, dynamic AI diagnostics, SWOT analysis, and executive report generator.',
      icon: TrendingUp,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      tagline: 'Strategic Intelligence & Stepper',
      statText: `${stats?.analytics?.totalReports || 9} Reports • Health Score ${stats?.analytics?.avgHealthScore || 88}/100`,
      recentEvent: recentActivity.find(a => a.appId === 'analytics')?.title || 'Diagnostic: Veloce Digital Logistics (Score 88)',
      lastAccessed: '4h ago',
      features: ['4-Pillar Stepper', 'SWOT Matrix', 'PDF & Excel Reports']
    }
  ];

  const handleOpenApp = (app: typeof apps[0]) => {
    recordAppAccess(app.id);
    navigate(`/apps/${app.slug}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Core Business Applications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dedicated enterprise tools integrated into your centralized workspace
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-400">
          4 Integrated Modules
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {apps.map((app) => {
          const Icon = app.icon;
          const favorited = isFavorite(app.id);

          return (
            <div
              key={app.id}
              className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Row: Icon, Titles & Favorite Toggle */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${app.iconBg} shadow-2xs transition-transform group-hover:scale-105`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {app.shortName} • {app.tagline}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite(app.id)}
                    title={favorited ? 'Remove from favorites' : 'Add to favorites'}
                    className={`p-2 rounded-xl transition-colors cursor-pointer ${
                      favorited
                        ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3.5 leading-relaxed">
                  {app.description}
                </p>

                {/* Feature Tags */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                  {app.features.map(f => (
                    <span
                      key={f}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Recent Application Activity Box */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Recent Activity</span>
                    <span className="flex items-center gap-1 font-normal lowercase">
                      <Clock className="w-3 h-3" /> {app.lastAccessed}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {app.recentEvent}
                  </p>
                </div>
              </div>

              {/* Bottom Row: Metrics & Open Button */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {app.statText}
                </span>

                <button
                  onClick={() => handleOpenApp(app)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-all shadow-xs group-hover:bg-indigo-600 cursor-pointer"
                >
                  <span>Open Application</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

