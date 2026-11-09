import React from 'react';
import { NavLink } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext.js';
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquareText,
  Compass,
  Scale,
  TrendingUp,
  CheckSquare2,
  FileText,
  ShieldCheck
} from 'lucide-react';

const navItems = [
  { to: '/apps/analytics/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
  { to: '/apps/analytics/stepper', label: 'Business Questions', icon: ClipboardList },
  { to: '/apps/analytics/swot', label: 'SWOT Analysis', icon: Compass },
  { to: '/apps/analytics/pros-cons', label: 'Pros & Cons', icon: Scale },
  { to: '/apps/analytics/growth', label: 'Growth Ideas', icon: TrendingUp },
  { to: '/apps/analytics/actions', label: 'Action Plan & Tasks', icon: CheckSquare2 },
  { to: '/apps/analytics/chat', label: 'Ask AI Advisor', icon: MessageSquareText },
  { to: '/apps/analytics/reports', label: 'Business Reports', icon: FileText }
];

export const Sidebar: React.FC = () => {
  const { activeBusiness, latestAnalysis } = useBusiness();

  const completion = activeBusiness?.completionPercentage || 0;

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-medium'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Profile Completion and Status Box */}
      <div className="p-4 border border-slate-200/80 bg-slate-50 m-3 rounded-2xl">
        {activeBusiness ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Profile Completed</span>
              <span className="text-blue-600 font-bold">{completion}%</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>

            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span className="capitalize">{activeBusiness.identity.businessStage} stage</span>
              <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-mono font-bold">
                {activeBusiness.identity.businessModel}
              </span>
            </div>

            {latestAnalysis?.status === 'running' && (
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-[11px] flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span className="truncate font-semibold">Analyzing business...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-2">
            No enterprise selected.
          </div>
        )}
      </div>
    </aside>
  );
};
