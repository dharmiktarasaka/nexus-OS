import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';
import { AddEditLeadModal } from '../components/AddEditLeadModal';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const location = useLocation();

  const isChatPage = location.pathname.endsWith('/chat');
  const isEmailPage = location.pathname.includes('/emails') || location.pathname.includes('/mail');

  const handleLeadSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-crm-bg">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!isChatPage && (
          <Navbar
            onMenuClick={() => setSidebarOpen(!sidebarOpen)}
            onOpenAddLeadModal={() => setIsAddModalOpen(true)}
          />
        )}

        <main className={`flex-1 min-h-0 overflow-hidden ${
          isChatPage ? 'p-0 h-full' : isEmailPage ? 'p-3 md:p-4 h-full flex flex-col' : 'overflow-y-auto p-4 md:p-8'
        }`}>
          <Outlet context={{ refreshTrigger, onLeadCreated: handleLeadSaved }} />
        </main>
      </div>

      {/* Global Add Lead Modal */}
      <AddEditLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleLeadSaved}
      />
    </div>
  );
};
