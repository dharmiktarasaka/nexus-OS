import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Leads } from './pages/Leads';
import { LeadDetail } from './pages/LeadDetail';
import { Kanban } from './pages/Kanban';
import { Followups } from './pages/Followups';
import { Tasks } from './pages/Tasks';
import { Companies } from './pages/Companies';
import { Users } from './pages/Users';
import { Folders } from './pages/Folders';
import { FolderDetail } from './pages/FolderDetail';
import { Chat } from './pages/Chat';
import { AuditLogs } from './pages/AuditLogs';
import { Trash } from './pages/Trash';
import { Settings } from './pages/Settings';
import { LeadGrabDashboard } from './pages/LeadGrab/LeadGrabDashboard';
import { LeadGrabDetail } from './pages/LeadGrab/LeadGrabDetail';
import { Emails } from './pages/Emails';
import { WhatsApp } from './pages/WhatsApp';
import { LinkedIn } from './pages/LinkedIn';

export function CrmApp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="kanban" element={<Kanban />} />
            <Route path="followups" element={<Followups />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="companies" element={<Companies />} />
            <Route path="leads-grab" element={<LeadGrabDashboard />} />
            <Route path="leads-grab/:id" element={<LeadGrabDetail />} />
            <Route path="folders" element={<Folders />} />
            <Route path="folders/:id" element={<FolderDetail />} />
            <Route path="emails" element={<Emails />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="linkedin" element={<LinkedIn />} />
            <Route path="chat" element={<Chat />} />
            <Route path="users" element={<Users />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="trash" element={<Trash />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="" replace />} />
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default CrmApp;

