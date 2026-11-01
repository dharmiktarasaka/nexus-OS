import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

import { MainLayout } from './layouts/MainLayout';
import { AuthLayout } from './layouts/AuthLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AcceptInvitation } from './pages/AcceptInvitation';
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
import { OutlookCallback } from './pages/OutlookCallback';
import { LinkedInCallback } from './pages/LinkedInCallback';
import { LeadGrabDashboard } from './pages/LeadGrab/LeadGrabDashboard';
import { LeadGrabDetail } from './pages/LeadGrab/LeadGrabDetail';
import { Emails } from './pages/Emails';
import { WhatsApp } from './pages/WhatsApp';
import { LinkedIn } from './pages/LinkedIn';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-crm-navy flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Public Invitation & OAuth Callback Routes */}
            <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
            <Route path="/auth/outlook/callback" element={<OutlookCallback />} />
            <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />

            {/* Protected App Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/leads-grab" element={<LeadGrabDashboard />} />
              <Route path="/leads-grab/:id" element={<LeadGrabDetail />} />
              <Route path="/folders" element={<Folders />} />
              <Route path="/folders/:id" element={<FolderDetail />} />
              <Route path="/emails" element={<Emails />} />
              <Route path="/whatsapp" element={<WhatsApp />} />
              <Route path="/linkedin" element={<LinkedIn />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/users" element={<Users />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/leads/:id" element={<LeadDetail />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/followups" element={<Followups />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/trash" element={<Trash />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
