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
        if (parsed.uid || parsed._id) {
          return {
            _id: parsed.uid || parsed._id,
            name: parsed.displayName || parsed.name || 'Enterprise User',
            email: parsed.email
          };
        }
      } catch (e) {}
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (platformAuth?.user) {
      setUser({
        _id: platformAuth.user.uid,
        name: platformAuth.user.displayName || 'Enterprise User',
        email: platformAuth.user.email
      });
    } else {
      setUser(null);
    }
  }, [platformAuth?.user]);

  const logout = async () => {
    if (platformAuth?.logout) {
      await platformAuth.logout();
    }
    const tokens = ['token', 'auth_token', 'crm_token', 'crm_user', 'nexus_current_user'];
    tokens.forEach(t => localStorage.removeItem(t));
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
