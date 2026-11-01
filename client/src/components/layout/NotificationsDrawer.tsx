import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  Share2,
  Globe,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const notifications = [
    {
      id: 'notif_1',
      app: 'CRM Management',
      type: 'crm',
      icon: Users,
      iconColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
      title: 'High-Priority Follow-up Overdue',
      message: 'Follow-up with Marcus Sterling (Horizon Health) was scheduled for 10:00 AM.',
      time: '25m ago',
      unread: true,
      actionUrl: '/apps/crm'
    },
    {
      id: 'notif_2',
      app: 'Social Media Management',
      type: 'social',
      icon: Share2,
      iconColor: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
      title: 'Post Scheduled for Automated Release',
      message: 'Carousel "5 SaaS Scaling Metrics" will publish to Instagram & LinkedIn in 3 hours.',
      time: '1h ago',
      unread: true,
      actionUrl: '/apps/social'
    },
    {
      id: 'notif_3',
      app: 'Business Analytics',
      type: 'analytics',
      icon: TrendingUp,
      iconColor: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
      title: 'Executive Diagnostic Report Ready',
      message: 'Analysis for Veloce Digital Logistics completed with overall health score of 88/100.',
      time: '3h ago',
      unread: true,
      actionUrl: '/apps/analytics'
    },
    {
      id: 'notif_4',
      app: 'Website Builder',
      type: 'website',
      icon: Globe,
      iconColor: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400',
      title: 'Gemini AI Generation Complete',
      message: 'NovaPay NeoBanking landing page generated with 4 responsive sections.',
      time: '5h ago',
      unread: false,
      actionUrl: '/apps/website-builder'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Notifications Center
              </h3>
              <p className="text-[11px] text-slate-400">
                Cross-application activity alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Notifications */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                onClick={() => {
                  onClose();
                  navigate(n.actionUrl);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  n.unread
                    ? 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-indigo-400'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${n.iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {n.app}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {n.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-400">
            3 unread alerts
          </span>
          <button
            onClick={() => {
              onClose();
              navigate('/activity');
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            <span>View Full Activity Stream</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

