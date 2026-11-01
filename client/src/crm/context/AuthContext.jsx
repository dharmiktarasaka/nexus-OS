import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crm_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    const nexusUser = localStorage.getItem('nexus_current_user');
    if (nexusUser) {
      try {
        const u = JSON.parse(nexusUser);
        return {
          _id: u.uid,
          name: u.displayName || 'Enterprise User',
          email: u.email,
          role: 'ADMIN',
          companyName: u.companyName || 'Personal Workspace'
        };
      } catch (e) {}
    }
    return null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('crm_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('crm_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          // Session verification deferred when server offline
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('crm_token', res.data.token);
      localStorage.setItem('crm_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem('crm_token', res.data.token);
      localStorage.setItem('crm_user', JSON.stringify(res.data.user));
    }
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    const keysToRemove = ['crm_token', 'crm_user', 'auth_token', 'token', 'nexus_current_user', 'studio_auth_token'];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    try {
      sessionStorage.clear();
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
