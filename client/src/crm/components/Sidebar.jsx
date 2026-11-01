import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  MessageSquare,
  UserCog,
  ShieldCheck,
  Trash2,
  Settings,
  LogOut,
  Sparkles,
  Mail,
  Inbox,
  Send,
  Clock,
  ChevronDown,
  ChevronRight,
  Smartphone,
  MapPin,
  Globe,
  Layers,
  Target,
  Gamepad2,
  Bot,
  ArrowLeft,
  Users as UsersIcon,
  Columns3,
  CalendarClock,
  ListTodo,
  Building2
} from 'lucide-react';
import Linkedin from './icons/LinkedinIcon';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';
  const getPath = (p) => `${basePath}${p === '/' ? '' : p}`;

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [emailCounts, setEmailCounts] = useState({ inboxUnread: 0, sentTotal: 0, scheduledTotal: 0, trashTotal: 0 });
  const [isEmailsOpen, setIsEmailsOpen] = useState(
    location.pathname.startsWith('/emails') || location.pathname.startsWith('/mail')
  );
  const [isLeadsGrabOpen, setIsLeadsGrabOpen] = useState(
    location.pathname.startsWith('/leads-grab')
  );
  const [isFoldersOpen, setIsFoldersOpen] = useState(
    location.pathname.startsWith('/folders')
  );
  const serverOfflineRef = React.useRef(false);

  const fetchStats = async () => {
    if (!user || serverOfflineRef.current) return;
    try {
      const [chatRes, emailRes] = await Promise.allSettled([
        api.get('/chat/unread-count'),
        api.get('/emails/stats')
      ]);

      const isChatOffline = chatRes.status === 'rejected' || chatRes.value?.data?.offline || !chatRes.value?.data?.success;
      const isEmailOffline = emailRes.status === 'rejected' || emailRes.value?.data?.offline || !emailRes.value?.data?.success;

      if (isChatOffline && isEmailOffline) {
        serverOfflineRef.current = true;
        // Back off for 60 seconds when backend is starting or offline
        setTimeout(() => { serverOfflineRef.current = false; }, 60000);
        return;
      }

      if (chatRes.status === 'fulfilled' && chatRes.value.data?.success) {
        setUnreadChatCount(chatRes.value.data.totalUnread || 0);
      }
      if (emailRes.status === 'fulfilled' && emailRes.value.data?.success) {
        setEmailCounts(emailRes.value.data.counts || { inboxUnread: 0, sentTotal: 0, scheduledTotal: 0, trashTotal: 0 });
      }
    } catch (err) {
      // Quiet fail
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Keep menu open if on respective routes
  useEffect(() => {
    if (location.pathname.startsWith('/emails')) {
      setIsEmailsOpen(true);
    }
    if (location.pathname.startsWith('/leads-grab')) {
      setIsLeadsGrabOpen(true);
    }
    if (location.pathname.startsWith('/folders')) {
      setIsFoldersOpen(true);
    }
  }, [location.pathname]);

  const currentFolder = new URLSearchParams(location.search).get('folder') || (location.pathname === '/emails' ? 'inbox' : '');
  const currentLeadChannel = new URLSearchParams(location.search).get('channel') || '';
  const currentCategory = new URLSearchParams(location.search).get('category') || '';

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Leads Grab', path: '/leads-grab', icon: Sparkles, badgeText: 'AI' },
    { label: 'My Folders', path: '/folders', icon: Folder },
    { label: 'CRM Chat', path: '/chat', icon: MessageSquare, badge: unreadChatCount },
    { label: 'Team Users', path: '/users', icon: UserCog, requirePerm: 'users.view' },
    { label: 'Security Audit', path: '/audit-logs', icon: ShieldCheck, requirePerm: 'audit.view' },
    { label: 'Trash', path: '/trash', icon: Trash2 },
    { label: 'Settings', path: '/settings', icon: Settings }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.requirePerm) return true;
    if (user?.role === 'ADMIN') return true;
    const [cat, act] = item.requirePerm.split('.');
    return user?.permissions?.[cat]?.[act] !== false;
  });

  const isEmailRoute = location.pathname.includes('/emails');
  const isLeadsGrabRoute = location.pathname.includes('/leads-grab');
  const isFoldersRoute = location.pathname.includes('/folders');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-crm-navy text-white flex flex-col transition-transform duration-300 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-crm-lime flex items-center justify-center font-black text-white text-sm shadow-md shadow-crm-lime/20">
              LF
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-wide text-white truncate max-w-[105px]">{user?.companyName || 'LeadFlow'}</h1>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">CRM Hub</span>
            </div>
          </div>
          <NavLink
            to="/"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[11px] font-bold transition-colors"
            title="Return to Nexus Platform Dashboard"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Platform</span>
          </NavLink>
        </div>

        {/* User Card */}
        <div className="p-3.5 mx-3 my-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-crm-lime/20 text-crm-lime font-bold flex items-center justify-center border border-crm-lime/30 shrink-0 text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
            </div>
            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-crm-lime text-crm-navy mt-0.5">
              {user?.role || 'User'}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* 1. Dashboard */}
          <NavLink
            to={getPath('/')}
            onClick={onClose}
            end
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                isActive || location.pathname === getPath('/')
                  ? 'bg-crm-lime text-white shadow-md shadow-crm-lime/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3 min-w-0">
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate">Dashboard</span>
            </div>
          </NavLink>

          {/* 2. LEADS GRAB WITH COLLAPSIBLE SUB-MENU */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsLeadsGrabOpen(!isLeadsGrabOpen);
                if (!isLeadsGrabRoute) {
                  navigate(getPath('/leads-grab'));
                  if (onClose) onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
                isLeadsGrabRoute
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-4 h-4 shrink-0 text-crm-lime" />
                <span className="truncate">Leads Grab</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider uppercase bg-crm-lime text-crm-navy">
                  AI
                </span>
                {isLeadsGrabOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Collapsible Sub-menu Items */}
            {isLeadsGrabOpen && (
              <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* All Discovery Hub */}
                <NavLink
                  to={getPath("/leads-grab")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isLeadsGrabRoute && !currentLeadChannel
                        ? 'bg-crm-lime text-crm-navy font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>All Campaigns</span>
                  </div>
                </NavLink>

                {/* LinkedIn Leads Panel */}
                <NavLink
                  to={getPath("/leads-grab?channel=linkedin")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isLeadsGrabRoute && currentLeadChannel === 'linkedin'
                        ? 'bg-[#0077b5] text-white font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                    <span>LinkedIn Leads</span>
                  </div>
                  <span className="text-[9px] bg-sky-400/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    B2B
                  </span>
                </NavLink>

                {/* Google Maps Leads Panel */}
                <NavLink
                  to={getPath("/leads-grab?channel=google-maps")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isLeadsGrabRoute && currentLeadChannel === 'google-maps'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Google Maps Leads</span>
                  </div>
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    Local
                  </span>
                </NavLink>

                {/* Discord Leads Panel */}
                <NavLink
                  to={getPath("/leads-grab?channel=discord")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isLeadsGrabRoute && currentLeadChannel === 'discord'
                        ? 'bg-[#5865F2] text-white font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-[#7289da]" />
                    <span>Discord Leads</span>
                  </div>
                  <span className="text-[9px] bg-[#5865F2]/30 text-indigo-200 px-1.5 py-0.2 rounded font-mono font-bold">
                    Community
                  </span>
                </NavLink>

                {/* TinyFish AI Leads Panel */}
                <NavLink
                  to={getPath("/leads-grab?channel=tinyfish")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isLeadsGrabRoute && currentLeadChannel === 'tinyfish'
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TinyFish AI Leads</span>
                  </div>
                  <span className="text-[9px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    AI Agent
                  </span>
                </NavLink>

                {/* Web Page Scraper Panel */}
                <NavLink
                  to={getPath("/leads-grab?channel=web")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isLeadsGrabRoute && currentLeadChannel === 'web'
                        ? 'bg-purple-600 text-white font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-3.5 h-3.5 text-purple-400" />
                    <span>Web Page Scraper</span>
                  </div>
                  <span className="text-[9px] bg-purple-400/20 text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    Web
                  </span>
                </NavLink>
              </div>
            )}
          </div>

          {/* 3. MY FOLDERS WITH COLLAPSIBLE SUB-MENU */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsFoldersOpen(!isFoldersOpen);
                if (!isFoldersRoute) {
                  navigate(getPath('/folders'));
                  if (onClose) onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
                isFoldersRoute
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Folder className="w-4 h-4 shrink-0 text-crm-lime" />
                <span className="truncate">My Folders</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isFoldersOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Collapsible Sub-menu Items */}
            {isFoldersOpen && (
              <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* All Folders */}
                <NavLink
                  to={getPath("/folders")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isFoldersRoute && !currentCategory
                        ? 'bg-crm-lime text-crm-navy font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5" />
                    <span>All Folders</span>
                  </div>
                </NavLink>

                {/* India Folders */}
                <NavLink
                  to={getPath("/folders?category=india")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isFoldersRoute && currentCategory.toLowerCase() === 'india'
                        ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>India</span>
                  </div>
                  <span className="text-[9px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    🇮🇳 IN
                  </span>
                </NavLink>

                {/* International Folders */}
                <NavLink
                  to={getPath("/folders?category=international")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isFoldersRoute && currentCategory.toLowerCase() === 'international'
                        ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-3.5 h-3.5 text-sky-400" />
                    <span>International</span>
                  </div>
                  <span className="text-[9px] bg-sky-400/20 text-sky-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    🌐 Global
                  </span>
                </NavLink>
              </div>
            )}
          </div>

          {/* 4. EMAILS WITH COLLAPSIBLE SUB-MENU */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setIsEmailsOpen(!isEmailsOpen);
                if (!isEmailRoute) {
                  navigate(getPath('/emails?folder=inbox'));
                  if (onClose) onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 select-none ${
                isEmailRoute
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Mail className="w-4 h-4 shrink-0 text-crm-lime" />
                <span className="truncate">Emails</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {emailCounts.inboxUnread > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {emailCounts.inboxUnread}
                  </span>
                )}
                {isEmailsOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </button>

            {/* Collapsible Sub-menu Items */}
            {isEmailsOpen && (
              <div className="pl-6 pr-1 py-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Inbox Sub-item */}
                <NavLink
                  to={getPath("/emails?folder=inbox")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isEmailRoute && (currentFolder === 'inbox' || !currentFolder)
                        ? 'bg-crm-lime text-crm-navy font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Inbox</span>
                  </div>
                  {emailCounts.inboxUnread > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                      {emailCounts.inboxUnread}
                    </span>
                  )}
                </NavLink>

                {/* Sent Sub-item */}
                <NavLink
                  to={getPath("/emails?folder=sent")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isEmailRoute && currentFolder === 'sent'
                        ? 'bg-crm-lime text-crm-navy font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Send className="w-3.5 h-3.5" />
                    <span>Sent</span>
                  </div>
                </NavLink>

                {/* Scheduled Sub-item */}
                <NavLink
                  to={getPath("/emails?folder=scheduled")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isEmailRoute && currentFolder === 'scheduled'
                        ? 'bg-crm-lime text-crm-navy font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Scheduled</span>
                  </div>
                </NavLink>

                {/* Trash Sub-item */}
                <NavLink
                  to={getPath("/emails?folder=trash")}
                  onClick={onClose}
                  className={() =>
                    `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isEmailRoute && currentFolder === 'trash'
                        ? 'bg-crm-lime text-crm-navy font-black shadow-xs'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Trash</span>
                  </div>
                </NavLink>
              </div>
            )}
          </div>

          {/* WhatsApp Bulk Engine */}
          <NavLink
            to={getPath("/whatsapp")}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <Smartphone className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span className="truncate">WhatsApp</span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider uppercase shrink-0 ${
                    isActive ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  LIVE
                </span>
              </>
            )}
          </NavLink>

          {/* LinkedIn Connection & Extractor */}
          <NavLink
            to={getPath("/linkedin")}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                isActive
                  ? 'bg-[#0077b5] text-white shadow-md shadow-[#0077b5]/30 font-black'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <Linkedin className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                  <span className="truncate">LinkedIn</span>
                </div>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider uppercase shrink-0 ${
                    isActive ? 'bg-white text-[#0077b5]' : 'bg-[#0077b5]/20 text-sky-300 border border-[#0077b5]/30'
                  }`}
                >
                  OAuth
                </span>
              </>
            )}
          </NavLink>

          {/* 5. CRM Chat */}
          <NavLink
            to={getPath("/chat")}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                isActive
                  ? 'bg-crm-lime text-crm-navy shadow-md shadow-crm-lime/20'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">CRM Chat</span>
                </div>
                {unreadChatCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded-full transition-transform shrink-0 ${
                      isActive
                        ? 'bg-crm-navy text-crm-lime shadow-xs'
                        : 'bg-rose-500 text-white shadow-xs shadow-rose-500/50 animate-pulse'
                    }`}
                  >
                    {unreadChatCount > 99 ? '99+' : unreadChatCount}
                  </span>
                )}
              </>
            )}
          </NavLink>

          {/* Remaining dynamic nav items */}
          {filteredNavItems
            .filter(item => !['Dashboard', 'Leads Grab', 'My Folders', 'CRM Chat'].includes(item.label))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={getPath(item.path)}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group ${
                      isActive
                        ? 'bg-crm-lime text-crm-navy shadow-md shadow-crm-lime/20'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>
    </>
  );
};
