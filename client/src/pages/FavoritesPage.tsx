import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ArrowRight, Sparkles, Users, Share2, Globe, TrendingUp } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { api, AppModule } from '../services/api';

export const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite } = useWorkspace();
  const [allModules, setAllModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getModules();
        setAllModules(res.core || []);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const favoritedApps = allModules.filter(m => favorites.includes(m.id) || favorites.includes(m.slug));

  const getIcon = (icon: string) => {
    switch (icon) {
      case 'Users':
        return <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
      case 'Share2':
        return <Share2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
      case 'Globe':
        return <Globe className="w-6 h-6 text-sky-600 dark:text-sky-400" />;
      case 'TrendingUp':
        return <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-indigo-600" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-current" />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Favorite Applications & Shortcuts
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pinned tools for instantaneous one-click executive access
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading favorites...</div>
      ) : favoritedApps.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No favorites pinned yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Click the star icon on any application overview card to pin it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {favoritedApps.map((app) => (
            <div
              key={app.id}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xl hover:border-indigo-400 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      {getIcon(app.icon)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {app.name}
                      </h3>
                      <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {app.shortName}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFavorite(app.id)}
                    className="p-2 text-amber-500 bg-amber-50 dark:bg-amber-950/40 rounded-xl"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                  {app.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {app.quickActions?.map((qa) => (
                    <button
                      key={qa.id}
                      onClick={() => navigate(`/apps/${app.slug}`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-[11px] font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {qa.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => navigate(`/apps/${app.slug}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  <span>Launch Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

