// client/src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';

// User's Firebase Configuration
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCgf1LkSrwobzqsGOM3dFqwekxcXQSNw-M",
  authDomain: "lyoo-7cc38.firebaseapp.com",
  projectId: "lyoo-7cc38",
  storageBucket: "lyoo-7cc38.firebasestorage.app",
  messagingSenderId: "354508992918",
  appId: "1:354508992918:web:665ff860ef14542078adb7",
  measurementId: "G-8MZYMVCPEJ"
};

// Helper to get configuration from env or localStorage or defaults
export function getFirebaseConfig() {
  const custom = localStorage.getItem('custom_firebase_config');
  if (custom) {
    try {
      return JSON.parse(custom);
    } catch (e) {
      console.warn('Failed to parse custom firebase config:', e);
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || DEFAULT_FIREBASE_CONFIG.measurementId
  };
}

let appInstance = null;
let authInstance = null;
let isRealFirebase = false;

try {
  const config = getFirebaseConfig();
  if (config.apiKey && config.projectId) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
    authInstance = getAuth(appInstance);
    isRealFirebase = true;
    console.log('[Firebase] Real Firebase initialized for project:', config.projectId);
  }
} catch (error) {
  console.warn('[Firebase] Firebase initialization deferred:', error.message);
}

// User-friendly error message translator for Firebase Auth exceptions
export function formatFirebaseAuthError(error) {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid. Please check your spelling.';
    case 'auth/user-disabled':
      return 'This user account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your email or create an account.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password or credential. Please try again or create an account.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups.';
    case 'auth/unauthorized-domain':
      return 'This domain (localhost) is not authorized in your Firebase Console. Please add localhost to Firebase Auth -> Settings -> Authorized Domains.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method to enable it.';
    default:
      return error.message || 'Authentication failed. Please verify credentials.';
  }
}

// Fallback Mock Authentication Provider for QA, local development, and guest sessions
class MockAuth {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    const saved = localStorage.getItem('mock_auth_user');
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
      } catch (e) {}
    }
  }

  notify() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  async signIn(email, password) {
    const user = {
      uid: 'user-' + btoa(email).slice(0, 8),
      email: email,
      displayName: email.split('@')[0],
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      isAnonymous: false,
      isMock: true
    };
    this.currentUser = user;
    localStorage.setItem('mock_auth_user', JSON.stringify(user));
    this.notify();
    return { user };
  }

  async signUp(email, password) {
    return this.signIn(email, password);
  }

  async signInWithGoogle() {
    return this.signIn('senior.director@design-studio.ai', 'google-auth');
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('mock_auth_user');
    this.notify();
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
}

const mockAuth = new MockAuth();

export {
  appInstance,
  authInstance,
  isRealFirebase,
  mockAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
};
