import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Plus,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Building,
  Check,
  Sparkles,
  Users,
  Share2,
  Globe,
  TrendingUp,
  Shield,
  ExternalLink,
  Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTheme } from '../../context/ThemeContext';

interface TopNavProps {
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  unreadCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenSearch,
  onOpenNotifications,
  unreadCount = 3
}) => {
  const { user, logout } = useAuth();
  const { currentWorkspace, workspaces, switchWorkspace, toggleMobileSidebar } = useWorkspace();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [quickActionDropdownOpen, setQuickActionDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const wsRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setQuickActionDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickAction = (route: string) => {
    setQuickActionDropdownOpen(false);
    navigate(route);
  };

  return (
    <header className="h-16 px-3 sm:px-6 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-2.5 sm:gap-4">
      {/* Mobile Hamburger Menu Toggle */}
      <button
        onClick={toggleMobileSidebar}
        type="button"
        aria-label="Toggle Navigation Menu"
        className="p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden cursor-pointer shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Left: Global Search Input & Trigger */}
      <div className="flex-1 max-w-lg min-w-0">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all text-left shadow-2xs group cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 min-w-0 truncate">
            <Search className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline truncate">
              Search across leads, posts, websites, reports...
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:hidden">
              Search...
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Workspace Switcher */}
        <div className="relative" ref={wsRef}>
          <button
            onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            <Building className="w-3.5 h-3.5 text-slate-500" />
            <span className="max-w-[120px] truncate">{currentWorkspace.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {workspaceDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Workspace
                </p>
              </div>
              <div className="py-1">
                {workspaces.map(ws => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWorkspaceDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {ws.name}
                      </p>
                      <p className="text-[10px] text-slate-500">{ws.role} • {ws.plan}</p>
                    </div>
                    {ws.id === currentWorkspace.id && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Button Dropdown */}
        <div className="relative" ref={actionRef}>
          <button
            onClick={() => setQuickActionDropdownOpen(!quickActionDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {quickActionDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Create
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => handleQuickAction('/apps/crm')}
                  className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Add New Lead</p>
                    <p className="text-[10px] text-slate-400">Personal Leads CRM</p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickAction('/apps/social')}
                  className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Schedule Social Post</p>
                    <p className="text-[10px] text-slate-400">Mediamation Publisher</p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickAction('/apps/website-builder')}
                  className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Build AI Website</p>
                    <p className="text-[10px] text-slate-400">Gemini Site Studio</p>
                  </div>
                </button>

                <button
                  onClick={() => handleQuickAction('/apps/analytics')}
                  className="w-full px-3 py-2 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">Start Business Diagnostic</p>
                    <p className="text-[10px] text-slate-400">STRATIQ AI Advisor</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Trigger */}
        <button
          onClick={onOpenNotifications}
          title="Notifications Center"
          className="relative w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <img
              src={user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
              alt={user?.displayName || 'User'}
              className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.displayName || 'Executive User'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'admin@tarasaka.io'}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                  <Shield className="w-3 h-3" />
                  <span>{user?.role || 'Enterprise Admin'}</span>
                </div>
              </div>

              <div className="py-1">
                <NavLink
                  to="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </NavLink>

                <NavLink
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span>Platform Settings</span>
                </NavLink>

                {/* Direct Theme Switch inside User Dropdown */}
                <button
                  onClick={() => {
                    toggleTheme();
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Theme</span>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 capitalize">
                    {theme}
                  </span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

