import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Schedule from './pages/Schedule.jsx';
import History from './pages/History.jsx';
import './index.css';

export function SocialApp() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <div className="mediamation-scope mediamation-container flex-1 flex flex-col min-h-0 w-full h-full overflow-hidden">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#181b2e',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  fontSize: '0.875rem'
                }
              }}
            />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="history" element={<History />} />
                <Route path="*" element={<Navigate to="" replace />} />
              </Route>
            </Routes>
          </div>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default SocialApp;

