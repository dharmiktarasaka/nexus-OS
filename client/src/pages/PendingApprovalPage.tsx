import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const PendingApprovalPage: React.FC = () => {
  const { user, logout, checkApprovalStatus } = useAuth();
  const navigate = useNavigate();

  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>(
    user?.status || 'PENDING'
  );
  const [rejectionMessage, setRejectionMessage] = useState('');
  const [countdown, setCountdown] = useState(4);

  // Function to poll access status from the backend
  const checkStatus = async (isManual = false) => {
    if (!user?.email) return;
    if (isManual) setChecking(true);

    try {
      const res = await api.checkAccessStatus({
        email: user.email,
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL
      });

      if (res.status === 'APPROVED') {
        setStatus('APPROVED');
        // Give 1.5 seconds celebration visual before redirecting
        setTimeout(() => {
          if (checkApprovalStatus) {
            checkApprovalStatus();
          }
          navigate('/', { replace: true });
        }, 1200);
      } else if (res.status === 'REJECTED') {
        setStatus('REJECTED');
        setRejectionMessage(res.message || 'Access request was declined by administrator.');
      } else {
        setStatus('PENDING');
      }
    } catch (e) {
      // Quiet retry
    } finally {
      if (isManual) setChecking(false);
      setCountdown(4);
    }
  };

  // Auto-polling interval every 4 seconds
  useEffect(() => {
    if (status === 'APPROVED') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          checkStatus();
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user, status]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          {/* Status Icon */}
          <div className="mx-auto">
            {status === 'APPROVED' ? (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in">
                <CheckCircle2 className="w-9 h-9 animate-pulse" />
              </div>
            ) : status === 'REJECTED' ? (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                <XCircle className="w-9 h-9" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <Clock className="w-9 h-9 animate-pulse" />
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {status === 'APPROVED'
                ? 'Access Approved!'
                : status === 'REJECTED'
                  ? 'Access Request Declined'
                  : 'Access Pending Approval'}
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {status === 'APPROVED'
                ? 'Your account has been approved by the administrator. Redirecting to workspace...'
                : status === 'REJECTED'
                  ? rejectionMessage || 'Your request to join the platform was declined by the administrator.'
                  : 'Your account has been registered and is waiting for administrator approval in the Admin Panel.'}
            </p>
          </div>

          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-left space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.displayName || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : status === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {status}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
              <span>Gatekeeper Status:</span>
              <span className="font-semibold text-slate-300">
                {status === 'APPROVED' ? 'Granted' : status === 'REJECTED' ? 'Blocked' : 'Queued in Admin Panel'}
              </span>
            </div>
          </div>

          {/* Action & Status Polling Controls */}
          {status !== 'APPROVED' && (
            <div className="space-y-3">
              <button
                onClick={() => checkStatus(true)}
                disabled={checking}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                <span>{checking ? 'Checking Status with Admin...' : 'Check Approval Status'}</span>
              </button>

              <p className="text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Auto-checking live status in {countdown}s...</span>
              </p>
            </div>
          )}

          {/* Sign Out Option */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Log In as Different User</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
