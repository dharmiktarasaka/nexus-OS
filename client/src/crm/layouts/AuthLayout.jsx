import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-crm-navy flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crm-navy via-crm-navy-dark to-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-crm-lime/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-crm-lime text-crm-navy font-black text-2xl shadow-xl shadow-crm-lime/20 mb-4">
          LF
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">LeadFlow CRM</h2>
        <p className="mt-1 text-xs text-slate-400 font-medium">Production-Grade MERN Lead Management System</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white/95 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-white/20">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
