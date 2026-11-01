import React, { useState, useEffect } from 'react';
import { Activity, Clock, Filter, Search } from 'lucide-react';
import { api, ActivityItem } from '../services/api';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterApp, setFilterApp] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getActivity();
        setActivities(res.activities || []);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = activities.filter(a => filterApp === 'ALL' || a.appId === filterApp);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Real-time Activity Stream
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chronological audit trail of actions across all integrated applications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'crm', 'social', 'website-builder', 'analytics'].map(appKey => (
            <button
              key={appKey}
              onClick={() => setFilterApp(appKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                filterApp === appKey
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {appKey === 'website-builder' ? 'Website' : appKey}
            </button>
          ))}
        </div>
      </div>

      <ActivityFeed activities={filtered} loading={loading} />
    </div>
  );
};

