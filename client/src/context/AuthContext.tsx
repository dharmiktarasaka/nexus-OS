import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  authInstance,
  isRealFirebase,
  googleProvider,
  mockAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from '../firebase/config';
import { api } from '../services/api';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  companyName?: string;
  phone?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginAsDemoExecutive: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  checkApprovalStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated session into sub-applications localStorage
  const syncSubAppSessions = (profile: UserProfile, bridgeData?: any) => {
    try {
      // 0. Central SaaS Session Token (Must be genuine verified JWT or existing valid session)
      const existingToken = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const centralToken = bridgeData?.token || bridgeData?.tokens?.central || (existingToken && !existingToken.startsWith('central_token_') ? existingToken : null);
      if (centralToken) {
        localStorage.setItem('auth_token', centralToken);
        localStorage.setItem('token', centralToken);
      }

      // 1. CRM Platform Tokens & User
      const existingCrmToken = localStorage.getItem('crm_token');
      const crmToken = bridgeData?.tokens?.crm || (existingCrmToken && !existingCrmToken.startsWith('crm_bridge_token_') ? existingCrmToken : centralToken);
      if (crmToken) {
        localStorage.setItem('crm_token', crmToken);
      }
      localStorage.setItem('crm_user', JSON.stringify({
        _id: profile.uid,
        name: profile.displayName,
        email: profile.email,
        role: profile.role || 'ADMIN',
        companyName: profile.companyName || 'Personal Workspace'
      }));

      // 2. Business Analytics (STRATIQ) Tokens & User
      const stratiqToken = bridgeData?.tokens?.stratiq || centralToken;
      localStorage.setItem('stratiq_user', JSON.stringify({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        businessName: profile.companyName || 'Personal Workspace',
        yearlyRevenue: '$1,000,000+'
      }));

      // 4. Website Builder Mock / Firebase Auth Session
      localStorage.setItem('mock_auth_user', JSON.stringify({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL
      }));

      // 5. Central Hub Profile
      localStorage.setItem('nexus_current_user', JSON.stringify(profile));
    } catch (err) {
      // Quiet sync
    }
  };

  // Map to deduplicate concurrent bridge requests (e.g. loginWithEmail + onAuthStateChanged)
  const inFlightBridges = React.useRef(new Map<string, Promise<UserProfile>>());

  // Helper to authenticate session and gate by administrator approval
  const handleAuthBridge = async (profile: UserProfile, idToken?: string, provider: string = 'email'): Promise<UserProfile> => {
    const key = (profile.email || profile.uid).toLowerCase().trim();
    const isMasterAdmin = key === 'dharmik.tarasaka@gmail.com';

    // 1. Immediately establish optimistic authenticated session
    const baseApprovedUser: UserProfile = {
      ...profile,
      status: 'APPROVED',
      role: isMasterAdmin ? 'Enterprise Administrator' : (profile.role || 'Enterprise Administrator'),
      companyName: profile.companyName || (isMasterAdmin ? 'Tarasaka Global Holdings' : 'Personal Workspace')
    };

    // If master admin, apply instantly so login is lightning fast (< 200ms)
    if (isMasterAdmin) {
      setUser(baseApprovedUser);
      localStorage.setItem('nexus_current_user', JSON.stringify(baseApprovedUser));
      syncSubAppSessions(baseApprovedUser);
    }

    // Deduplicate in-flight bridge calls for the exact same user
    const existingPromise = inFlightBridges.current.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    const bridgePromise = (async () => {
      try {
        const bridge = await api.bridgeAuth({ ...profile, idToken, provider }, 6000);
        const serverApprovedUser: UserProfile = {
          ...profile,
          status: 'APPROVED',
          role: isMasterAdmin ? 'Enterprise Administrator' : (bridge?.user?.role || profile.role || 'Enterprise Administrator')
        };
        setUser(serverApprovedUser);
        localStorage.setItem('nexus_current_user', JSON.stringify(serverApprovedUser));
        syncSubAppSessions(serverApprovedUser, bridge);
        return serverApprovedUser;
      } catch (err: any) {
        if (err.status === 'PENDING' || err.message?.includes('pending') || err.message?.includes('administrator approval')) {
          const pendingUser: UserProfile = { ...profile, status: 'PENDING' };
          setUser(pendingUser);
          localStorage.setItem('nexus_current_user', JSON.stringify(pendingUser));
          return pendingUser;
        }
        if (err.status === 'REJECTED' || err.message?.includes('declined')) {
          const rejectedUser: UserProfile = { ...profile, status: 'REJECTED' };
          setUser(rejectedUser);
          localStorage.setItem('nexus_current_user', JSON.stringify(rejectedUser));
          return rejectedUser;
        }

        // On server cold-start / network timeout / offline mode:
        // Keep authenticated session active so the user is never locked out
        setUser(baseApprovedUser);
        localStorage.setItem('nexus_current_user', JSON.stringify(baseApprovedUser));
        syncSubAppSessions(baseApprovedUser);
        return baseApprovedUser;
      } finally {
        inFlightBridges.current.delete(key);
      }
    })();

    inFlightBridges.current.set(key, bridgePromise);
    return bridgePromise;
  };

  const checkApprovalStatus = async () => {
    if (!user?.email) return;
    try {
      const bridge = await api.bridgeAuth({ ...user });
      const approved: UserProfile = { ...user, status: 'APPROVED' };
      setUser(approved);
      localStorage.setItem('nexus_current_user', JSON.stringify(approved));
      syncSubAppSessions(approved, bridge);
    } catch (e: any) {
      // Quiet check
    }
  };

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const handleUnauthorized = () => {
      console.warn('[AuthContext] Received unauthorized event: clearing expired session');
      const tokens = ['auth_token', 'token', 'crm_token', 'crm_user', 'nexus_current_user', 'stratiq_user', 'mock_auth_user'];
      tokens.forEach(t => localStorage.removeItem(t));
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    if (isRealFirebase && authInstance) {
      unsubscribe = onAuthStateChanged(authInstance, async (fbUser) => {
        if (fbUser) {
          const idToken = await fbUser.getIdToken().catch(() => undefined);
          const profile: UserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || 'executive@company.io',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Executive User',
            photoURL: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            role: 'Enterprise Administrator',
            companyName: 'Personal Workspace'
          };

          // Optimistically load cached or profile session instantly to eliminate startup latency
          const saved = localStorage.getItem('nexus_current_user');
          if (saved) {
            try {
              setUser(JSON.parse(saved));
            } catch {
              setUser(profile);
            }
          } else {
            setUser(profile);
          }
          setLoading(false);

          // Synchronize token & server status asynchronously in background
          handleAuthBridge(profile, idToken, 'firebase-auto').catch(() => {});
        } else {
          // Check saved session in localStorage - require token to exist
          const saved = localStorage.getItem('nexus_current_user');
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          if (saved && token) {
            try {
              setUser(JSON.parse(saved));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      });
    } else {
      unsubscribe = mockAuth.onAuthStateChanged(async (mockUser) => {
        if (mockUser) {
          setUser(mockUser);
          setLoading(false);
          handleAuthBridge(mockUser, undefined, 'mock-auto').catch(() => {});
        } else {
          const saved = localStorage.getItem('nexus_current_user');
          const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
          if (saved && token) {
            try {
              setUser(JSON.parse(saved));
            } catch {
              setUser(null);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }
      });
    }

    return () => {
      unsubscribe();
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      if (isRealFirebase && authInstance) {
        const res = await signInWithPopup(authInstance, googleProvider);
        const idToken = await res.user.getIdToken().catch(() => undefined);
        const isMaster = res.user.email?.toLowerCase().trim() === 'dharmik.tarasaka@gmail.com';
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email!,
          displayName: res.user.displayName || res.user.email!.split('@')[0],
          photoURL: res.user.photoURL || undefined,
          role: isMaster ? 'Enterprise Administrator' : 'Enterprise Administrator',
          companyName: isMaster ? 'Tarasaka Global Holdings' : 'Personal Workspace',
          status: 'APPROVED'
        };
        setUser(profile);
        localStorage.setItem('nexus_current_user', JSON.stringify(profile));
        syncSubAppSessions(profile);

        // Fast background sync - do not block login redirect
        handleAuthBridge(profile, idToken, 'google').catch(() => {});
      } else {
        await loginAsDemoExecutive();
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      if (isRealFirebase && authInstance) {
        const res = await signInWithEmailAndPassword(authInstance, email, pass);
        const idToken = await res.user.getIdToken().catch(() => undefined);
        const isMaster = res.user.email?.toLowerCase().trim() === 'dharmik.tarasaka@gmail.com';
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email!,
          displayName: res.user.displayName || res.user.email!.split('@')[0],
          role: isMaster ? 'Enterprise Administrator' : 'Enterprise Administrator',
          companyName: isMaster ? 'Tarasaka Global Holdings' : 'Personal Workspace',
          status: 'APPROVED'
        };
        setUser(profile);
        localStorage.setItem('nexus_current_user', JSON.stringify(profile));
        syncSubAppSessions(profile);

        // Fast background sync - do not block login redirect
        handleAuthBridge(profile, idToken, 'password').catch(() => {});
      } else {
        const res = await mockAuth.signIn(email);
        setUser(res.user);
        handleAuthBridge(res.user, undefined, 'mock-email').catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    setLoading(true);
    try {
      if (isRealFirebase && authInstance) {
        const res = await createUserWithEmailAndPassword(authInstance, email, pass);
        await updateProfile(res.user, { displayName: name });
        const idToken = await res.user.getIdToken().catch(() => undefined);
        const isMaster = res.user.email?.toLowerCase().trim() === 'dharmik.tarasaka@gmail.com';
        const profile: UserProfile = {
          uid: res.user.uid,
          email: res.user.email!,
          displayName: name,
          role: isMaster ? 'Enterprise Administrator' : 'Enterprise Administrator',
          companyName: isMaster ? 'Tarasaka Global Holdings' : 'Personal Workspace',
          status: 'APPROVED'
        };
        setUser(profile);
        localStorage.setItem('nexus_current_user', JSON.stringify(profile));
        syncSubAppSessions(profile);

        handleAuthBridge(profile, idToken, 'registration').catch(() => {});
      } else {
        const res = await mockAuth.signIn(email);
        res.user.displayName = name;
        setUser(res.user);
        handleAuthBridge(res.user, undefined, 'mock-register').catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoExecutive = async () => {
    const demoUser: UserProfile = {
      uid: 'exec_demo_2026',
      email: 'dharmik.tarasaka@gmail.com',
      displayName: 'Dharmik Tarasaka',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80',
      role: 'Enterprise Founder & Admin',
      companyName: 'Tarasaka Global Holdings',
      phone: '+1 (555) 789-2026'
    };
    try {
      const bridge = await api.bridgeAuth({ ...demoUser, provider: 'demo-executive' });
      const approvedUser: UserProfile = { ...demoUser, status: 'APPROVED' };
      setUser(approvedUser);
      localStorage.setItem('nexus_current_user', JSON.stringify(approvedUser));
      syncSubAppSessions(approvedUser, bridge);
    } catch {
      setUser(demoUser);
      syncSubAppSessions(demoUser);
    }
  };

  const resetPassword = async (email: string) => {
    if (isRealFirebase && authInstance) {
      await sendPasswordResetEmail(authInstance, email);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('nexus_current_user', JSON.stringify(updated));
    syncSubAppSessions(updated);
  };

  const logout = async () => {
    if (isRealFirebase && authInstance) {
      await firebaseSignOut(authInstance).catch(() => {});
    }
    await mockAuth.signOut().catch(() => {});
    setUser(null);

    // Completely clear all stored user tokens and private cached states
    try {
      const theme = localStorage.getItem('nexus_theme');
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key !== 'nexus_theme') {
          localStorage.removeItem(key);
        }
      }
      if (theme) localStorage.setItem('nexus_theme', theme);
    } catch (e) {}

    try {
      sessionStorage.clear();
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginAsDemoExecutive,
        resetPassword,
        updateUserProfile,
        checkApprovalStatus,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

