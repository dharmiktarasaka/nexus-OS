import React from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface StatCardProps {
  label: string;
  value: number | string;
  sublabel: string;
  icon: LucideIcon;
  iconColor: string;
  appUrl: string;
  badge?: string;
  badgeColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  iconColor,
  appUrl,
  badge,
  badgeColor = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
}) => {
  return (
    <NavLink
      to={appUrl}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/60 transition-all flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {label}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>{sublabel}</span>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
      </div>
    </NavLink>
  );
};

