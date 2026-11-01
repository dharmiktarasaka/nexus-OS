// client/src/website/WebsiteApp.jsx - AI Website Builder Embedded Studio
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import NewProjectPage from './pages/NewProjectPage';
import EditorPage from './pages/EditorPage';
import './index.css';

export function WebsiteApp() {
  return (
    <AuthProvider>
      <div className="website-builder-wrapper flex-1 flex flex-col min-h-0 w-full">
        <Routes>
          <Route
            index
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="new"
            element={
              <ProtectedRoute>
                <NewProjectPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="editor/:id"
            element={
              <ProtectedRoute>
                <EditorPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default WebsiteApp;

