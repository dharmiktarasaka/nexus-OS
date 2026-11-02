import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  LogOut,
  UserCheck,
  UserX,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Trash2,
  Mail,
  Calendar,
  Globe
} from 'lucide-react';
import { adminApi } from '../services/api';
import { useAdminAuth } from '../context/AdminAuthContext';

export const AdminDashboardPage = () => {
  const { admin, logout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // id of row being processed
  const [toastMessage, setToastMessage] = useState(null);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(5);

  const prevPendingCountRef = useRef(0);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await adminApi.getRequests('ALL');
      if (data.success) {
        setRequests(data.requests || []);
        if (data.counts) {
          // Play visual cue if new pending request arrived
          if (data.counts.pending > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
            showToast(`🔔 New access request received!`, 'info');
          }
          prevPendingCountRef.current = data.counts.pending;
          setCounts(data.counts);
        }
      }
    } catch (err) {
      if (isManual) {
        showToast(err.response?.data?.message || 'Failed to fetch access requests', 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setAutoRefreshCountdown(5);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // 5-second automatic polling interval for live real-time synchronization
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          loadData();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Actions
  const handleApprove = async (id, email) => {
    setActionLoading(id);
    try {
      const res = await adminApi.approveRequest(id);
      if (res.success) {
        showToast(`✅ Approved access for ${email}! They can now log in.`, 'success');
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id, email) => {
    const reason = window.prompt(`Reason for rejecting access request for ${email} (optional):`, 'Access request declined by administrator');
    if (reason === null) return; // User cancelled prompt

    setActionLoading(id);
    try {
      const res = await adminApi.rejectRequest(id, reason);
      if (res.success) {
        showToast(`❌ Access request for ${email} rejected.`, 'info');
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (id, email) => {
    if (!window.confirm(`Revoke login access for ${email}? They will no longer be able to log in until approved again.`)) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await adminApi.revokeRequest(id);
      if (res.success) {
        showToast(`⚠️ Access revoked for ${email}. Status set back to PENDING.`, 'info');
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to revoke request', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Delete access record for ${email}?`)) {
      return;
    }

    setActionLoading(id);
    try {
      const res = await adminApi.deleteRequest(id);
      if (res.success) {
        showToast(`🗑️ Record for ${email} removed.`, 'info');
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete record', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesTab = activeTab === 'ALL' ? true : req.status === activeTab;
    const query = search.trim().toLowerCase();
    const matchesSearch = !query ||
      (req.email && req.email.toLowerCase().includes(query)) ||
      (req.displayName && req.displayName.toLowerCase().includes(query));
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(dateStr);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border transition-all animate-in slide-in-from-top-2 ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/90 text-rose-200 border-rose-800'
            : toastMessage.type === 'info'
              ? 'bg-amber-950/90 text-amber-200 border-amber-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
        }`}>
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                NEXUS OS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gatekeeper Control
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time Live Sync (polls every {autoRefreshCountdown}s)</span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh access requests immediately"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* Admin User Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
              {admin?.displayName ? admin.displayName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-[11px] font-bold text-white truncate max-w-[130px]">{admin?.displayName || 'Super Admin'}</p>
              <p className="text-[9px] text-indigo-400 font-semibold">{admin?.email || 'admin'}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            title="Sign out of Admin Portal"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner Alert for Pending Requests */}
        {counts.pending > 0 && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-600/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-amber-300">
                  {counts.pending} User Access Request{counts.pending > 1 ? 's' : ''} Awaiting Approval
                </h3>
                <p className="text-xs text-amber-200/80">
                  Users are currently held at the login screen until you accept them below.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('PENDING')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              Review Requests Now
            </button>
          </div>
        )}

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* 1. Pending */}
          <div
            onClick={() => setActiveTab('PENDING')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'PENDING'
                ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Pending Review</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-400">{counts.pending}</span>
              <span className="text-[10px] text-amber-400/80 font-bold">Awaiting Action</span>
            </div>
          </div>

          {/* 2. Approved */}
          <div
            onClick={() => setActiveTab('APPROVED')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Approved Users</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">{counts.approved}</span>
              <span className="text-[10px] text-emerald-400/80 font-bold">Active in Platform</span>
            </div>
          </div>

          {/* 3. Rejected */}
          <div
            onClick={() => setActiveTab('REJECTED')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'REJECTED'
                ? 'bg-rose-500/10 border-rose-500/50 shadow-lg shadow-rose-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Rejected / Blocked</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400">{counts.rejected}</span>
              <span className="text-[10px] text-rose-400/80 font-bold">Access Blocked</span>
            </div>
          </div>

          {/* 4. Total Inquiries */}
          <div
            onClick={() => setActiveTab('ALL')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'ALL'
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total User Base</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-400">{counts.total}</span>
              <span className="text-[10px] text-indigo-400/80 font-bold">All Records</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-2xl border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'PENDING'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Pending</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'PENDING' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400'
              }`}>
                {counts.pending}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'APPROVED'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Approved</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'APPROVED' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-emerald-400'
              }`}>
                {counts.approved}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'REJECTED'
                  ? 'bg-rose-500 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Rejected</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'REJECTED' ? 'bg-slate-950 text-rose-400' : 'bg-slate-800 text-rose-400'
              }`}>
                {counts.rejected}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Users ({counts.total})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[260px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Requests Table / Cards List */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading user access requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-300">
                {activeTab === 'PENDING'
                  ? 'No Pending Requests'
                  : activeTab === 'APPROVED'
                    ? 'No Approved Users Found'
                    : 'No Records Match Filter'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {activeTab === 'PENDING'
                  ? 'All user access requests have been reviewed. When someone attempts to sign up or log in on the main site, they will instantly appear here.'
                  : 'Try adjusting your search query or filter tab.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredRequests.map((req) => {
                const isItemLoading = actionLoading === req._id || actionLoading === req.uid;
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isRejected = req.status === 'REJECTED';

                return (
                  <div
                    key={req._id || req.uid}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors"
                  >
                    {/* User Info */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden shadow-sm">
                        {req.photoURL ? (
                          <img src={req.photoURL} alt={req.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{(req.displayName || req.email || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-extrabold text-white truncate">
                            {req.displayName || 'Unspecified Name'}
                          </h4>

                          {/* Status Badge */}
                          {isPending && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                              Pending Approval
                            </span>
                          )}

                          {isApproved && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Approved & Active
                            </span>
                          )}

                          {isRejected && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              Rejected
                            </span>
                          )}

                          {/* Provider Badge */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            {req.provider || 'email'}
                          </span>
                        </div>

                        {/* Email & Timestamps */}
                        <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                          <span className="text-slate-300 font-medium">{req.email}</span>
                          <span className="text-slate-600">•</span>
                          <span title={formatDate(req.requestedAt)}>
                            Requested {formatRelativeTime(req.requestedAt)} ({formatDate(req.requestedAt)})
                          </span>
                        </div>

                        {req.rejectionReason && (
                          <p className="text-[11px] text-rose-400 mt-0.5">
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      {isPending && (
                        <>
                          <button
                            onClick={() => handleApprove(req._id || req.uid, req.email)}
                            disabled={isItemLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Accept & Grant Access</span>
                          </button>

                          <button
                            onClick={() => handleReject(req._id || req.uid, req.email)}
                            disabled={isItemLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <>
                          <span className="text-xs text-emerald-400 font-semibold hidden lg:inline mr-2">
                            Can log in to Main Site
                          </span>
                          <button
                            onClick={() => handleRevoke(req._id || req.uid, req.email)}
                            disabled={isItemLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
                            title="Temporarily suspend access"
                          >
                            <span>Revoke Access</span>
                          </button>
                        </>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => handleApprove(req._id || req.uid, req.email)}
                          disabled={isItemLoading}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Re-approve Access</span>
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(req._id || req.uid, req.email)}
                        disabled={isItemLoading}
                        title="Delete request"
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

