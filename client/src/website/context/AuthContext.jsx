// client/src/context/AuthContext.jsx - Unified MongoDB & Cloud Auth State
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWebsiteApiUrl } from '../apiConfig';
import {
  authInstance,
  isRealFirebase,
  mockAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('studio_auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Sync user object into MongoDB database
  const syncToMongoDB = async (userData) => {
    try {
      const res = await fetch(getWebsiteApiUrl('/api/auth/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          firebaseUid: userData.uid || userData.id,
          authProvider: userData.authProvider || (isRealFirebase ? 'firebase' : 'guest')
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('studio_auth_token', data.token);
          setToken(data.token);
        }
        return data.user;
      }
    } catch (err) {
      console.warn('[AuthContext] MongoDB user sync notice:', err.message);
    }
    return userData;
  };

  useEffect(() => {
    let unsubscribe;

    const initAuth = async () => {
      // 1. Check if token exists in localStorage and verify with MongoDB
      const savedToken = localStorage.getItem('studio_auth_token');
      if (savedToken) {
        try {
          const res = await fetch(getWebsiteApiUrl('/api/auth/me'), {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              setLoading(false);
              return;
            }
          }
        } catch (_err) {}
      }

      // 2. Listen to Firebase or local session
      if (isRealFirebase && authInstance) {
        unsubscribe = onAuthStateChanged(authInstance, async (currentUser) => {
          if (currentUser) {
            const synced = await syncToMongoDB({
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              uid: currentUser.uid,
              authProvider: 'firebase'
            });
            setUser({ ...currentUser, ...synced });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        unsubscribe = mockAuth.onAuthStateChanged(async (currentUser) => {
          if (currentUser) {
            const synced = await syncToMongoDB({
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              uid: currentUser.uid,
              authProvider: 'guest'
            });
            setUser({ ...currentUser, ...synced });
          } else {
            setUser(null);
          }
          setLoading(false);
        });
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // MongoDB Native Register
  const signup = async (email, password, displayName) => {
    try {
      const res = await fetch(getWebsiteApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed in MongoDB');
      }

      if (data.token) {
        localStorage.setItem('studio_auth_token', data.token);
        setToken(data.token);
      }
      setUser(data.user);

      // Also register in Firebase if configured
      if (isRealFirebase && authInstance) {
        try {
          await createUserWithEmailAndPassword(authInstance, email, password);
        } catch (_fErr) {}
      }

      return data.user;
    } catch (err) {
      // If server registration fails, check Firebase as fallback
      if (isRealFirebase && authInstance) {
        const userCred = await createUserWithEmailAndPassword(authInstance, email, password);
        const synced = await syncToMongoDB({
          email: userCred.user.email,
          displayName: userCred.user.displayName,
          photoURL: userCred.user.photoURL,
          uid: userCred.user.uid,
          authProvider: 'firebase'
        });
        setUser(synced);
        return synced;
      }
      throw err;
    }
  };

  // MongoDB Native Login
  const login = async (email, password) => {
    try {
      const res = await fetch(getWebsiteApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        if (data.token) {
          localStorage.setItem('studio_auth_token', data.token);
          setToken(data.token);
        }
        setUser(data.user);
        return data.user;
      }

      // If MongoDB returns 401/error, check Firebase in case it was a Firebase user
      if (isRealFirebase && authInstance) {
        const userCred = await signInWithEmailAndPassword(authInstance, email, password);
        const synced = await syncToMongoDB({
          email: userCred.user.email,
          displayName: userCred.user.displayName,
          photoURL: userCred.user.photoURL,
          uid: userCred.user.uid,
          authProvider: 'firebase'
        });
        setUser(synced);
        return synced;
      }

      throw new Error(data.error || 'Invalid credentials');
    } catch (err) {
      if (isRealFirebase && authInstance) {
        const userCred = await signInWithEmailAndPassword(authInstance, email, password);
        const synced = await syncToMongoDB({
          email: userCred.user.email,
          displayName: userCred.user.displayName,
          photoURL: userCred.user.photoURL,
          uid: userCred.user.uid,
          authProvider: 'firebase'
        });
        setUser(synced);
        return synced;
      }
      throw err;
    }
  };

  // Google Sign-In with MongoDB Sync
  const loginWithGoogle = async () => {
    let authUser = null;
    if (isRealFirebase && authInstance) {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(authInstance, provider);
      authUser = res.user;
    } else {
      authUser = await mockAuth.signInWithGoogle();
    }

    if (authUser) {
      const synced = await syncToMongoDB({
        email: authUser.email,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
        uid: authUser.uid,
        authProvider: 'google'
      });
      setUser({ ...authUser, ...synced });
      return synced;
    }
  };

  // 1-Click QA Director Sign-In with MongoDB Sync
  const loginAsGuest = async () => {
    const qaEmail = 'qa.director@premium-studio.com';
    const synced = await syncToMongoDB({
      email: qaEmail,
      displayName: 'QA Director',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      uid: 'qa-director-mongo-id',
      authProvider: 'guest'
    });
    setUser(synced);
    return synced;
  };

  // Logout
  const logout = async () => {
    localStorage.removeItem('studio_auth_token');
    localStorage.removeItem('pulse_offline_projects');
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pulse_offline_projects_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
    setToken(null);
    if (isRealFirebase && authInstance) {
      await signOut(authInstance);
    } else {
      await mockAuth.signOut();
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        loginWithGoogle,
        loginAsGuest,
        logout,
        isRealFirebase
      }}
    >
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
