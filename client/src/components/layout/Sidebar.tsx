import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Star,
  Briefcase,
  Users,
  Share2,
  Globe,
  TrendingUp,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Command,
  ExternalLink,
  X
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const {
    currentWorkspace,
    sidebarCollapsed,
    toggleSidebar,
    favorites,
    mobileSidebarOpen,
    setMobileSidebarOpen
  } = useWorkspace();
  const { user } = useAuth();
  const location = useLocation();

  const mainDashboardNav = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Recent Activity', path: '/activity', icon: Activity },
    { name: 'Favorites', path: '/favorites', icon: Star, badge: favorites.length ? `${favorites.length}` : undefined },
    { name: 'My Workspace', path: '/workspace', icon: Briefcase }
  ];

  const businessAppsNav = [
    {
      id: 'crm',
      name: 'CRM Management',
      shortName: 'CRM',
      path: '/apps/crm',
      icon: Users,
      badge: 'Core',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
    },
    {
      id: 'social',
      name: 'Social Media',
      shortName: 'Social',
      path: '/apps/social',
      icon: Share2,
      badge: 'Auto',
      badgeColor: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
    },
    {
      id: 'website-builder',
      name: 'Website Builder',
      shortName: 'Studio',
      path: '/apps/website-builder',
      icon: Globe,
      badge: 'AI',
      badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
    },
    {
      id: 'analytics',
      name: 'Business Analytics',
      shortName: 'Advisor',
      path: '/apps/analytics',
      icon: TrendingUp,
      badge: 'Pro',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
    },
    {
      id: 'marketplace',
      name: 'More Tools',
      shortName: 'Hub',
      path: '/apps/marketplace',
      icon: PlusCircle,
      badge: '10+',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
    }
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out shadow-2xl md:shadow-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <NavLink
            to="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 overflow-hidden"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Command className="w-5 h-5" />
            </div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  NEXUS OS
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Business Platform
                </span>
              </div>
            )}
          </NavLink>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              onClick={toggleSidebar}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden md:flex w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white items-center justify-center transition-colors shadow-2xs cursor-pointer"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center cursor-pointer"
              aria-label="Close mobile navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Workspace Banner */}
        {(!sidebarCollapsed || mobileSidebarOpen) && (
          <div className="p-3 mx-3 mt-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {currentWorkspace.initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {currentWorkspace.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {currentWorkspace.plan}
                </p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-subtle" title="Active Organization" />
          </div>
        )}

        {/* Navigation Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Section A: Main Dashboard */}
          <div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <p className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Main Dashboard
              </p>
            )}
            <nav className="space-y-1">
              {mainDashboardNav.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={sidebarCollapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    } ${sidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
                    }`} />
                    {(!sidebarCollapsed || mobileSidebarOpen) && (
                      <span className="truncate flex-1">{item.name}</span>
                    )}
                    {(!sidebarCollapsed || mobileSidebarOpen) && item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Section B: Business Applications */}
          <div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Business Applications
                </p>
                <span className="text-[10px] font-medium text-slate-400">4 Core</span>
              </div>
            )}
            <nav className="space-y-1">
              {businessAppsNav.map((app) => {
                const Icon = app.icon;
                const isActive = location.pathname.startsWith(app.path);
                return (
                  <NavLink
                    key={app.id}
                    to={app.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={sidebarCollapsed ? app.name : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    } ${sidebarCollapsed && !mobileSidebarOpen ? 'justify-center' : ''}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`} />
                    {(!sidebarCollapsed || mobileSidebarOpen) && (
                      <span className="truncate flex-1">{app.name}</span>
                    )}
                    {(!sidebarCollapsed || mobileSidebarOpen) && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                        isActive ? 'bg-white/20 text-white' : app.badgeColor
                      }`}>
                        {app.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Quick Info */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <NavLink
            to="/profile"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
          >
            <img
              src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={user?.displayName || 'Executive'}
              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
            />
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.displayName || 'Executive User'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'admin@tarasaka.io'}
                </p>
              </div>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};

