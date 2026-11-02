import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminApi } from '../services/api';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('nexus_admin_token');
      const savedAdmin = localStorage.getItem('nexus_admin_profile');
      if (savedToken && savedAdmin) {
        setToken(savedToken);
        setAdmin(JSON.parse(savedAdmin));
      }
    } catch (e) {
      localStorage.removeItem('nexus_admin_token');
      localStorage.removeItem('nexus_admin_profile');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, masterKey) => {
    const data = await adminApi.login(email, password, masterKey);
    if (data.success && data.token) {
      setToken(data.token);
      setAdmin(data.admin);
      localStorage.setItem('nexus_admin_token', data.token);
      localStorage.setItem('nexus_admin_profile', JSON.stringify(data.admin));
      return data;
    }
    throw new Error(data.message || 'Authentication failed');
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('nexus_admin_token');
    localStorage.removeItem('nexus_admin_profile');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, token, login, logout, loading, isAuthenticated: Boolean(token) }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

