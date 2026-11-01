import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Share2,
  Globe,
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';
import { WelcomeBanner } from '../components/dashboard/WelcomeBanner';
import { StatCard } from '../components/dashboard/StatCard';
import { AppCardsGrid } from '../components/dashboard/AppCardsGrid';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { QuickWorkflowBar } from '../components/dashboard/QuickWorkflowBar';
import { api, DashboardStats, ActivityItem } from '../services/api';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      const [statsRes, actRes] = await Promise.allSettled([
        api.getStats(),
        api.getActivity()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.stats);
      }
      if (actRes.status === 'fulfilled') {
        setActivities(actRes.value.activities || []);
      }
    } catch (err) {
      // Quiet fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Welcome Section */}
      <WelcomeBanner onQuickAction={(route) => navigate(route)} />

      {/* 2. Quick Statistics Row (5 Core Metrics from actual app data) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Executive Performance KPIs
            </h2>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
              Live Database
            </span>
          </div>
          <button
            onClick={handleRefresh}
            title="Refresh dashboard stats"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Data</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Total Leads"
            value={stats?.crm?.totalLeads ?? 0}
            sublabel="Personal Leads CRM"
            icon={Users}
            iconColor="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60"
            appUrl="/apps/crm"
            badge="Live Pipeline"
            badgeColor="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          />

          <StatCard
            label="Social Posts"
            value={stats?.social?.totalPosts ?? 0}
            sublabel="Published & Drafts"
            icon={Share2}
            iconColor="text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60"
            appUrl="/apps/social"
            badge="Mediamation"
            badgeColor="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
          />

          <StatCard
            label="Scheduled Posts"
            value={stats?.social?.scheduledPosts ?? 0}
            sublabel="Autonomous Queue"
            icon={Clock}
            iconColor="text-amber-600 bg-amber-50 dark:bg-amber-950/60"
            appUrl="/apps/social"
            badge="Ready"
            badgeColor="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
          />

          <StatCard
            label="Website Projects"
            value={stats?.website?.totalProjects ?? 0}
            sublabel="AI Studio Sites"
            icon={Globe}
            iconColor="text-sky-600 bg-sky-50 dark:bg-sky-950/60"
            appUrl="/apps/website-builder"
            badge="Gemini AI"
            badgeColor="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400"
          />

          <StatCard
            label="Business Reports"
            value={stats?.analytics?.totalReports ?? 0}
            sublabel="Strategic Audits"
            icon={TrendingUp}
            iconColor="text-purple-600 bg-purple-50 dark:bg-purple-950/60"
            appUrl="/apps/analytics"
            badge="STRATIQ"
            badgeColor="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400"
          />
        </div>
      </div>

      {/* 3. Application Overview Cards */}
      <AppCardsGrid stats={stats} recentActivity={activities} />

      {/* 4. Cross-App Automations */}
      <QuickWorkflowBar />

      {/* 5. Unified Recent Activity Feed */}
      <ActivityFeed activities={activities} loading={loading} />
    </div>
  );
};

