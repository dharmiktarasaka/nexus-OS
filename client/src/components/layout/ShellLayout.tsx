import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { GlobalSearchModal } from '../search/GlobalSearchModal';
import { NotificationsDrawer } from './NotificationsDrawer';

export const ShellLayout: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  // Full-height fixed desktop layouts (like CRM with its own sidebar and the split-screen code studio)
  const isFixedLayoutApp =
    location.pathname.startsWith('/apps/crm') ||
    location.pathname.startsWith('/crm') ||
    location.pathname.includes('/editor');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Execution Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Global Top Navigation Bar */}
        <TopNav
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={() => setNotificationsOpen(true)}
          unreadCount={3}
        />

        {/* Dynamic Route Content */}
        <main className={`flex-1 min-h-0 flex flex-col ${isFixedLayoutApp ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </div>
  );
};

