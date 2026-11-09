import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { AppLayout } from './components/layout/AppLayout';

import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { StepperPage } from './pages/StepperPage';
import { AnalysisProgressPage } from './pages/AnalysisProgressPage';
import { SwotPage } from './pages/SwotPage';
import { ProsConsPage } from './pages/ProsConsPage';
import { GrowthPage } from './pages/GrowthPage';
import { ChatPage } from './pages/ChatPage';
import { ActionPlanPage } from './pages/ActionPlanPage';
import { ReportsPage } from './pages/ReportsPage';
import { ReportViewerPage } from './pages/ReportViewerPage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

export const AnalyticsApp: React.FC = () => {
  return (
    <AuthProvider>
      <BusinessProvider>
        <div className="analytics-app-scope w-full h-full flex flex-col flex-1 min-h-0 overflow-hidden bg-slate-50 text-slate-900">
          <AppLayout>
            <Routes>
              <Route index element={<DashboardPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="onboarding" element={<OnboardingPage />} />
              <Route path="stepper" element={<StepperPage />} />
              <Route path="analysis/:id" element={<AnalysisProgressPage />} />
              <Route path="swot" element={<SwotPage />} />
              <Route path="pros-cons" element={<ProsConsPage />} />
              <Route path="growth" element={<GrowthPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="actions" element={<ActionPlanPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/:id" element={<ReportViewerPage />} />
              <Route path="profile" element={<Navigate to="stepper" replace />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
          </AppLayout>
        </div>
      </BusinessProvider>
    </AuthProvider>
  );
};

export default AnalyticsApp;

