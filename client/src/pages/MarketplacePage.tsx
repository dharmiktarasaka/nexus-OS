import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Plus,
  Sparkles,
  Layers,
  Search,
  PenTool,
  MapPin,
  BarChart2,
  Mail,
  PhoneCall,
  Kanban,
  Briefcase,
  Zap,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { ModuleRegistryModal } from '../components/marketplace/ModuleRegistryModal';

export const MarketplacePage: React.FC = () => {
  const [upcomingTools, setUpcomingTools] = useState<any[]>([]);
  const [coreTools, setCoreTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const res = await api.getModules();
        setCoreTools(res.core || []);
        setUpcomingTools(res.upcoming || []);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };
    loadModules();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'PenTool':
        return <PenTool className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Search':
        return <Search className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'MapPin':
        return <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'BarChart2':
        return <BarChart2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'Mail':
        return <Mail className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'PhoneCall':
        return <PhoneCall className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Kanban':
        return <Kanban className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  const handleRegisterNewTool = (newTool: any) => {
    setUpcomingTools([newTool, ...upcomingTools]);
  };

  const filteredUpcoming = upcomingTools.filter(tool => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.tagline.toLowerCase().includes(search.toLowerCase()) ||
      tool.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || tool.category.toUpperCase() === selectedCategory.toUpperCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Modular Expansion Architecture</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Applications & Integrations Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Scale your business operating system. Add AI voice agents, SEO tools, paid advertising engines, or integrate custom in-house tools.
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-all shadow-md shadow-black/20 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-indigo-600" />
          <span>Register New Module</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search upcoming tools, categories, keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'Marketing', 'Search & Traffic', 'Advertising', 'Sales Automation', 'Operations', 'Automation'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredUpcoming.map((tool) => (
          <div
            key={tool.id}
            className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  {getIcon(tool.icon)}
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {tool.badge || 'Ready to Connect'}
                </span>
              </div>

              <div className="mt-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {tool.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {tool.name}
                </h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                  {tool.tagline}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">
                  {tool.description}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                1-Click Integration
              </span>
              <button
                onClick={() => alert(`Enabling module: ${tool.name}. Connection configuration generated.`)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Enable Module
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Module Registry Modal */}
      <ModuleRegistryModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={handleRegisterNewTool}
      />
    </div>
  );
};

