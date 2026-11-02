import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { ThemeProvider } from './context/ThemeContext';
import { ShellLayout } from './components/layout/ShellLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { ActivityPage } from './pages/ActivityPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { AppWorkspacePage } from './pages/AppWorkspacePage';
import { MarketplacePage } from './pages/MarketplacePage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { CrmApp } from './crm/CrmApp';
import { WebsiteApp } from './website/WebsiteApp';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-3">
        <div className="w-9 h-9 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Loading Nexus Business Platform...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === 'PENDING' || user.status === 'REJECTED') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

// Preserve subpaths for any direct CRM sub-route navigation
const DynamicCrmRedirect: React.FC = () => {
  const location = useLocation();
  const search = location.search || '';
  return <Navigate to={`/apps/crm${location.pathname}${search}`} replace />;
};

// Preserve subpaths for any direct Website Builder navigation
const DynamicWebsiteRedirect: React.FC = () => {
  const location = useLocation();
  const search = location.search || '';
  const subPath = location.pathname.replace(/^\/(website-builder|website)/, '');
  return <Navigate to={`/apps/website-builder${subPath}${search}`} replace />;
};

const DynamicWebsiteEditorRedirect: React.FC = () => {
  const location = useLocation();
  const search = location.search || '';
  return <Navigate to={`/apps/website-builder${location.pathname}${search}`} replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <Routes>
              {/* Public Authentication Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/pending-approval" element={<PendingApprovalPage />} />

              {/* Protected Platform Application Shell */}
              <Route
                element={
                  <ProtectedRoute>
                    <ShellLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/activity" element={<ActivityPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/workspace" element={<WorkspacePage />} />
                <Route path="/apps/crm/*" element={<CrmApp />} />
                <Route path="/apps/website-builder/*" element={<WebsiteApp />} />
                <Route path="/apps/website/*" element={<WebsiteApp />} />
                <Route path="/apps/:appSlug" element={<AppWorkspacePage />} />
                <Route path="/apps/marketplace" element={<MarketplacePage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />

                {/* Direct CRM Convenience Redirects - dynamically preserving subpaths & parameters */}
                <Route path="/crm" element={<Navigate to="/apps/crm" replace />} />
                <Route path="/crm/*" element={<DynamicCrmRedirect />} />
                <Route path="/leads" element={<Navigate to="/apps/crm/leads" replace />} />
                <Route path="/leads/*" element={<DynamicCrmRedirect />} />
                <Route path="/kanban" element={<Navigate to="/apps/crm/kanban" replace />} />
                <Route path="/kanban/*" element={<DynamicCrmRedirect />} />
                <Route path="/followups" element={<Navigate to="/apps/crm/followups" replace />} />
                <Route path="/followups/*" element={<DynamicCrmRedirect />} />
                <Route path="/tasks" element={<Navigate to="/apps/crm/tasks" replace />} />
                <Route path="/tasks/*" element={<DynamicCrmRedirect />} />
                <Route path="/companies" element={<Navigate to="/apps/crm/companies" replace />} />
                <Route path="/companies/*" element={<DynamicCrmRedirect />} />
                <Route path="/folders" element={<Navigate to="/apps/crm/folders" replace />} />
                <Route path="/folders/*" element={<DynamicCrmRedirect />} />
                <Route path="/leads-grab" element={<Navigate to="/apps/crm/leads-grab" replace />} />
                <Route path="/leads-grab/*" element={<DynamicCrmRedirect />} />
                <Route path="/emails" element={<Navigate to="/apps/crm/emails" replace />} />
                <Route path="/emails/*" element={<DynamicCrmRedirect />} />
                <Route path="/whatsapp" element={<Navigate to="/apps/crm/whatsapp" replace />} />
                <Route path="/whatsapp/*" element={<DynamicCrmRedirect />} />
                <Route path="/linkedin" element={<Navigate to="/apps/crm/linkedin" replace />} />
                <Route path="/linkedin/*" element={<DynamicCrmRedirect />} />
                <Route path="/chat" element={<Navigate to="/apps/crm/chat" replace />} />
                <Route path="/chat/*" element={<DynamicCrmRedirect />} />
                <Route path="/users" element={<Navigate to="/apps/crm/users" replace />} />
                <Route path="/users/*" element={<DynamicCrmRedirect />} />
                <Route path="/audit-logs" element={<Navigate to="/apps/crm/audit-logs" replace />} />
                <Route path="/audit-logs/*" element={<DynamicCrmRedirect />} />
                <Route path="/trash" element={<Navigate to="/apps/crm/trash" replace />} />
                <Route path="/trash/*" element={<DynamicCrmRedirect />} />

                {/* Direct Website Builder Convenience Redirects */}
                <Route path="/website-builder" element={<Navigate to="/apps/website-builder" replace />} />
                <Route path="/website-builder/*" element={<DynamicWebsiteRedirect />} />
                <Route path="/website" element={<Navigate to="/apps/website-builder" replace />} />
                <Route path="/website/*" element={<DynamicWebsiteRedirect />} />
                <Route path="/new" element={<Navigate to="/apps/website-builder/new" replace />} />
                <Route path="/editor/*" element={<DynamicWebsiteEditorRedirect />} />
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </WorkspaceProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;

