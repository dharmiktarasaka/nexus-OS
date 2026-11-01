import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, FileSpreadsheet, Bell, Menu, Check, MessageSquare } from 'lucide-react';
import api from '../services/api';

export const Navbar = ({ onMenuClick, onOpenAddLeadModal }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const serverOfflineRef = React.useRef(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (serverOfflineRef.current) return;
      try {
        const [followRes, taskRes, chatRes] = await Promise.all([
          api.get('/followups?filter=today').catch(() => ({ data: null })),
          api.get('/tasks?status=TODO').catch(() => ({ data: null })),
          api.get('/chat/unread-count').catch(() => ({ data: null }))
        ]);

        if (
          (!followRes?.data?.success || followRes?.data?.offline) &&
          (!taskRes?.data?.success || taskRes?.data?.offline) &&
          (!chatRes?.data?.success || chatRes?.data?.offline)
        ) {
          serverOfflineRef.current = true;
          setTimeout(() => { serverOfflineRef.current = false; }, 60000);
          return;
        }

        const list = [];

        if (chatRes?.data?.totalUnread > 0) {
          list.push({
            id: 'chat_unread',
            title: `CRM Chat: ${chatRes.data.totalUnread} Unread Message${chatRes.data.totalUnread > 1 ? 's' : ''}`,
            sub: 'You have pending messages waiting for reply',
            type: 'chat',
            link: `${basePath}/chat`
          });
        }

        if (followRes?.data?.followUps) {
          followRes.data.followUps.forEach(f => {
            list.push({
              id: 'f_' + f._id,
              title: `Follow-up due: ${f.leadId?.name || 'Lead'}`,
              sub: f.note || f.time,
              type: 'followup',
              link: `${basePath}/leads/${f.leadId?._id}`
            });
          });
        }

        if (taskRes?.data?.tasks) {
          taskRes.data.tasks.slice(0, 5).forEach(t => {
            list.push({
              id: 't_' + t._id,
              title: `Task: ${t.title}`,
              sub: `Priority: ${t.priority}`,
              type: 'task',
              link: `${basePath}/tasks`
            });
          });
        }

        setNotifications(list);
      } catch (err) {
        // quiet fallback
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [basePath]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`${basePath}/leads?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile Menu & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search leads by name, company, phone, or email..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100/70 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-crm-lime/20 focus:border-crm-lime transition-all"
          />
        </form>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Add Lead Button */}
        {onOpenAddLeadModal && (
          <button
            type="button"
            onClick={onOpenAddLeadModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-crm-lime text-white text-xs font-bold hover:opacity-90 shadow-xs transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h4>
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-full">
                  {notifications.length} alerts
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400 font-medium">No pending notifications</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        if (n.link) navigate(n.link);
                      }}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                        {n.type === 'chat' && (
                          <span className="p-1 rounded-md bg-crm-lime/20 text-crm-lime">
                            <MessageSquare className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{n.sub}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
