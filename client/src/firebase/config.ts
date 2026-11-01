import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';

// User's Production Firebase Project (lyoo-7cc38)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgf1LkSrwobzqsGOM3dFqwekxcXQSNw-M",
  authDomain: "lyoo-7cc38.firebaseapp.com",
  projectId: "lyoo-7cc38",
  storageBucket: "lyoo-7cc38.firebasestorage.app",
  messagingSenderId: "354508992918",
  appId: "1:354508992918:web:665ff860ef14542078adb7",
  measurementId: "G-8MZYMVCPEJ"
};

let appInstance = null;
let authInstance = null;
let isRealFirebase = false;

try {
  appInstance = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  authInstance = getAuth(appInstance);
  isRealFirebase = true;
} catch (error) {
  // Silent fallback to local auth
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Mock provider for offline development & executive demo fallback
class CentralMockAuth {
  private user: any = null;
  private listeners: ((user: any) => void)[] = [];

  constructor() {
    const saved = localStorage.getItem('nexus_auth_user');
    if (saved) {
      try {
        this.user = JSON.parse(saved);
      } catch (e) {}
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.user));
  }

  async signIn(email: string) {
    const u = {
      uid: 'exec_' + btoa(email).slice(0, 8),
      email,
      displayName: email.split('@')[0].replace('.', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase()),
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=140&q=80',
      role: 'Enterprise Administrator',
      company: 'Tarasaka Global Enterprise',
      isMock: true
    };
    this.user = u;
    localStorage.setItem('nexus_auth_user', JSON.stringify(u));
    this.notify();
    return { user: u };
  }

  async signOut() {
    this.user = null;
    localStorage.removeItem('nexus_auth_user');
    this.notify();
  }

  onAuthStateChanged(callback: (user: any) => void) {
    this.listeners.push(callback);
    callback(this.user);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
}

const mockAuth = new CentralMockAuth();

export {
  appInstance,
  authInstance,
  isRealFirebase,
  googleProvider,
  mockAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
};

