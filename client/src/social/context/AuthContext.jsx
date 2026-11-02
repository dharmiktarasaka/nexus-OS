import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth as usePlatformAuth } from '../../context/AuthContext';
import { authAPI } from '../api/index.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  let platformAuth = null;
  try {
    platformAuth = usePlatformAuth();
  } catch (e) {}

  const [user, setUser] = useState(() => {
    if (platformAuth?.user) {
      return {
        _id: platformAuth.user.uid,
        name: platformAuth.user.displayName || 'Enterprise User',
        email: platformAuth.user.email
      };
    }
    const stored = localStorage.getItem('nexus_current_user') || localStorage.getItem('crm_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          _id: parsed.uid || parsed._id,
          name: parsed.displayName || parsed.name || 'Enterprise User',
          email: parsed.email
        };
      } catch (e) {}
    }
    return {
      _id: 'nexus_user_master',
      name: 'Nexus Executive',
      email: 'admin@nexus.io'
    };
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (platformAuth?.user) {
      setUser({
        _id: platformAuth.user.uid,
        name: platformAuth.user.displayName || 'Enterprise User',
        email: platformAuth.user.email
      });
    }
  }, [platformAuth?.user]);

  const logout = async () => {
    if (platformAuth?.logout) {
      await platformAuth.logout();
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
