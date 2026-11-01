import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Share2,
  Globe,
  TrendingUp,
  Clock,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { ActivityItem } from '../../services/api';

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading }) => {
  const getAppBadge = (appId: string) => {
    switch (appId) {
      case 'crm':
        return {
          icon: Users,
          color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
        };
      case 'social':
        return {
          icon: Share2,
          color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
        };
      case 'website-builder':
        return {
          icon: Globe,
          color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800'
        };
      case 'analytics':
        return {
          icon: TrendingUp,
          color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800'
        };
      default:
        return {
          icon: Users,
          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
        };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 60) return `${diffMins || 1}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'recent';
    }
  };

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Unified Recent Activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time event stream across your 4 connected applications
          </p>
        </div>
        <NavLink
          to="/activity"
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      {loading && (
        <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <span>Synchronizing activity stream...</span>
        </div>
      )}

      {!loading && activities.length > 0 && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {activities.map((item) => {
            const { icon: Icon, color } = getAppBadge(item.appId);
            return (
              <NavLink
                key={item.id}
                to={item.actionUrl}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4 group hover:bg-slate-50/60 dark:hover:bg-slate-800/40 p-2 -mx-2 rounded-2xl transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.appName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80">
                    {item.badge}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
};

