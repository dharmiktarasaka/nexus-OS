import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Send,
  Clock,
  Trash2,
  Star,
  Search,
  RefreshCw,
  Plus,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  CheckSquare,
  Square,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  Paperclip,
  Tag,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  XCircle,
  Ban
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { ComposeEmailModal } from '../components/ComposeEmailModal';

export const Emails = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeFolderParam = (searchParams.get('folder') || 'inbox').toLowerCase();

  const { showSuccess, showError, showInfo } = useToast();

  // Active folder: 'inbox' | 'sent' | 'scheduled' | 'starred' | 'trash'
  const [activeFolder, setActiveFolder] = useState(activeFolderParam);

  // Email List State
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [selectedEmailThread, setSelectedEmailThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD' | 'STARRED' | 'REPLIED'
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalItems: 0 });

  // Counts & Stats
  const [counts, setCounts] = useState({
    inboxUnread: 0,
    inboxTotal: 0,
    sentTotal: 0,
    scheduledTotal: 0,
    trashTotal: 0,
    starredTotal: 0
  });

  // Selection & Actions
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [syncingInbox, setSyncingInbox] = useState(false);

  // Inline Reply Box State
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Keep state synced with URL search params
  useEffect(() => {
    if (activeFolderParam !== activeFolder) {
      setActiveFolder(activeFolderParam);
      setSelectedEmail(null);
      setSelectedEmailIds([]);
      setPage(1);
    }
  }, [activeFolderParam]);

  const handleSelectFolder = (f) => {
    setActiveFolder(f);
    setSearchParams({ folder: f });
    setSelectedEmail(null);
    setSelectedEmailIds([]);
    setPage(1);
  };

  // Fetch Emails
  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        folder: activeFolder.toUpperCase(),
        page,
        limit: 20,
        search: search.trim() || undefined,
        isRead: filterType === 'UNREAD' ? 'false' : undefined,
        isStarred: filterType === 'STARRED' ? 'true' : undefined,
        status: filterType === 'REPLIED' ? 'REPLIED' : undefined
      };

      const res = await api.get('/emails', { params });
      if (res.data?.success) {
        setEmails(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, totalPages: 1, totalItems: 0 });
        if (res.data.counts) {
          setCounts(res.data.counts);
        }

        // If currently viewing an email, keep it or refresh it
        if (selectedEmail) {
          const fresh = res.data.data.find(e => e._id === selectedEmail._id);
          if (fresh) setSelectedEmail(fresh);
        }
      } else if (res.data?.offline) {
        setEmails([]);
        setCounts({ inboxUnread: 0, sentTotal: 0, scheduledTotal: 0, trashTotal: 0 });
      }
    } catch (err) {
      if (!err.message?.includes('Network Error')) {
        showError('Failed to load emails');
      }
    } finally {
      setLoading(false);
    }
  }, [activeFolder, page, search, filterType]);

  useEffect(() => {
    fetchEmails();
    // Auto-refresh inbox and reply threads every 30s
    const pollInterval = setInterval(() => {
      fetchEmails();
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [fetchEmails]);

  // Fetch Single Email Thread
  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    setReplyBody('');
    setLoadingThread(true);
    try {
      const res = await api.get(`/emails/${email._id}`);
      if (res.data?.success) {
        setSelectedEmail(res.data.data);
        setSelectedEmailThread(res.data.thread || [res.data.data]);

        // Update local read state
        setEmails(prev => prev.map(e => e._id === email._id ? { ...e, isRead: true } : e));
        setCounts(prev => ({
          ...prev,
          inboxUnread: Math.max(0, prev.inboxUnread - (email.isRead ? 0 : 1))
        }));
      }
    } catch (err) {
      showError('Failed to load conversation details');
    } finally {
      setLoadingThread(false);
    }
  };

  // Sync Inbox via Outlook
  const handleSyncInbox = async () => {
    setSyncingInbox(true);
    try {
      const res = await api.post('/emails/sync-inbox');
      if (res.data?.success) {
        showSuccess(res.data.message || 'Inbox synced successfully!');
        fetchEmails();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to sync inbox with Outlook');
    } finally {
      setSyncingInbox(false);
    }
  };

  // Send Manual Inline Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedEmail || !replyBody.trim()) {
      showError('Please write your reply message before sending');
      return;
    }

    setSendingReply(true);
    try {
      const res = await api.post(`/emails/${selectedEmail._id}/reply`, {
        body: replyBody.trim()
      });

      if (res.data?.success) {
        showSuccess(res.data.message || 'Reply sent successfully!');
        setReplyBody('');
        // Reload email thread
        handleSelectEmail(selectedEmail);
        fetchEmails();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send reply. Please check your SMTP settings.');
    } finally {
      setSendingReply(false);
    }
  };

  // Toggle Star
  const handleToggleStar = async (emailId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/emails/${emailId}/star`);
      if (res.data?.success) {
        setEmails(prev => prev.map(item => item._id === emailId ? { ...item, isStarred: res.data.isStarred } : item));
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(prev => ({ ...prev, isStarred: res.data.isStarred }));
        }
        setCounts(prev => ({
          ...prev,
          starredTotal: prev.starredTotal + (res.data.isStarred ? 1 : -1)
        }));
      }
    } catch (err) {
      showError('Failed to star email');
    }
  };

  // Mark Read / Unread
  const handleToggleRead = async (emailId, currentIsRead, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/emails/${emailId}/read`, { isRead: !currentIsRead });
      if (res.data?.success) {
        setEmails(prev => prev.map(item => item._id === emailId ? { ...item, isRead: res.data.isRead } : item));
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(prev => ({ ...prev, isRead: res.data.isRead }));
        }
      }
    } catch (err) {
      showError('Failed to update read status');
    }
  };

  // Move to Trash
  const handleMoveToTrash = async (emailId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/emails/${emailId}/trash`);
      if (res.data?.success) {
        showSuccess('Email moved to Trash');
        setEmails(prev => prev.filter(item => item._id !== emailId));
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(null);
        }
        fetchEmails();
      }
    } catch (err) {
      showError('Failed to delete email');
    }
  };

  // Cancel Scheduled Follow-Up
  const handleCancelFollowUp = async (emailId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this scheduled follow-up email?')) return;

    try {
      const res = await api.post(`/emails/${emailId}/cancel`);
      if (res.data?.success) {
        showSuccess(res.data.message || 'Follow-up cancelled successfully!');
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(prev => ({
            ...prev,
            status: 'DENIED',
            errorMessage: 'Cancelled manually by user'
          }));
        }
        fetchEmails();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to cancel follow-up');
    }
  };

  // Restore from Trash
  const handleRestoreFromTrash = async (emailId) => {
    try {
      const res = await api.post(`/emails/${emailId}/restore`);
      if (res.data?.success) {
        showSuccess(res.data.message || 'Email restored');
        setEmails(prev => prev.filter(item => item._id !== emailId));
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(null);
        }
        fetchEmails();
      }
    } catch (err) {
      showError('Failed to restore email');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (emailId) => {
    if (!window.confirm('Are you sure you want to permanently delete this email? This cannot be undone.')) return;
    try {
      const res = await api.delete(`/emails/${emailId}`);
      if (res.data?.success) {
        showSuccess('Email permanently deleted');
        setEmails(prev => prev.filter(item => item._id !== emailId));
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(null);
        }
        fetchEmails();
      }
    } catch (err) {
      showError('Failed to delete email');
    }
  };

  // Bulk Actions
  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedEmailIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmailIds.length === emails.length) {
      setSelectedEmailIds([]);
    } else {
      setSelectedEmailIds(emails.map(e => e._id));
    }
  };

  const handleBulkTrash = async () => {
    if (selectedEmailIds.length === 0) return;
    try {
      const res = await api.post('/emails/bulk-trash', { emailIds: selectedEmailIds });
      if (res.data?.success) {
        showSuccess(res.data.message || 'Emails moved to Trash');
        setSelectedEmailIds([]);
        setSelectedEmail(null);
        fetchEmails();
      }
    } catch (err) {
      showError('Failed to trash selected emails');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmailIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${selectedEmailIds.length} selected emails?`)) return;
    try {
      const res = await api.post('/emails/bulk-delete', { emailIds: selectedEmailIds });
      if (res.data?.success) {
        showSuccess(res.data.message || 'Emails permanently deleted');
        setSelectedEmailIds([]);
        setSelectedEmail(null);
        fetchEmails();
      }
    } catch (err) {
      showError('Failed to delete selected emails');
    }
  };

  const handleBulkMarkRead = async (isRead) => {
    if (selectedEmailIds.length === 0) return;
    try {
      const res = await api.post('/emails/bulk-read', { emailIds: selectedEmailIds, isRead });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setSelectedEmailIds([]);
        fetchEmails();
      }
    } catch (err) {
      showError('Failed to update email status');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-3 animate-in fade-in duration-200 overflow-hidden">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-md border border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-crm-lime/20 text-crm-lime flex items-center justify-center font-black shadow-xs shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight flex items-center gap-2">
              <span>Email Hub</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-crm-lime text-crm-navy font-extrabold uppercase tracking-wider">
                SMTP & Microsoft 365
              </span>
            </h2>
            <p className="text-[11px] text-slate-300">
              Unified inbox, sent campaigns, reply management, and automated queues
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncInbox}
            disabled={syncingInbox}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10 disabled:opacity-50"
            title="Sync inbox with Microsoft Outlook"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingInbox ? 'animate-spin' : ''}`} />
            <span>{syncingInbox ? 'Syncing...' : 'Sync Inbox'}</span>
          </button>

          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Email</span>
          </button>
        </div>
      </div>

      {/* Main Master-Detail Email Work Area */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 overflow-hidden">
        {/* ── 1. Left Folder Sidebar (md:col-span-3 lg:col-span-2) ── */}
        <div className="hidden md:flex md:col-span-3 lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-3 flex-col justify-between shadow-xs overflow-y-auto shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Email Folders
            </div>

            {/* Inbox */}
            <button
              onClick={() => handleSelectFolder('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'inbox'
                  ? 'bg-crm-navy text-crm-lime shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Inbox</span>
              </div>
              {counts.inboxUnread > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeFolder === 'inbox' ? 'bg-crm-lime text-crm-navy' : 'bg-rose-500 text-white'
                }`}>
                  {counts.inboxUnread}
                </span>
              )}
            </button>

            {/* Sent */}
            <button
              onClick={() => handleSelectFolder('sent')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'sent'
                  ? 'bg-crm-navy text-crm-lime shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Sent</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{counts.sentTotal}</span>
            </button>

            {/* Scheduled */}
            <button
              onClick={() => handleSelectFolder('scheduled')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'scheduled'
                  ? 'bg-crm-navy text-crm-lime shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Scheduled</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{counts.scheduledTotal}</span>
            </button>

            {/* Starred */}
            <button
              onClick={() => handleSelectFolder('starred')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'starred'
                  ? 'bg-crm-navy text-crm-lime shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>Starred</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{counts.starredTotal}</span>
            </button>

            {/* Trash */}
            <button
              onClick={() => handleSelectFolder('trash')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeFolder === 'trash'
                  ? 'bg-crm-navy text-rose-300 shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Trash</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">{counts.trashTotal}</span>
            </button>
          </div>

          {/* Bottom Provider Info */}
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-crm-navy">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mail Connection</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Connected to custom SMTP / Microsoft 365. Configure in <strong>Settings</strong>.
            </p>
          </div>
        </div>

        {/* ── 2. Middle Email List (md:col-span-4 lg:col-span-4) ── */}
        <div className={`bg-white rounded-2xl border border-slate-200/80 flex flex-col shadow-xs overflow-hidden ${
          selectedEmail ? 'hidden md:flex md:col-span-4 lg:col-span-4' : 'col-span-1 md:col-span-4 lg:col-span-4'
        }`}>
          {/* Email List Header Toolbar */}
          <div className="p-3 border-b border-slate-100 space-y-2 shrink-0 bg-white">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={`Search ${activeFolder}...`}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20"
              />
            </div>

            {/* Folder & Bulk Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSelectAll}
                  className="p-1 text-slate-500 hover:text-crm-navy rounded-md hover:bg-slate-100"
                  title="Select All"
                >
                  {selectedEmailIds.length === emails.length && emails.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-crm-lime" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {selectedEmailIds.length > 0 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleBulkMarkRead(true)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                      title="Mark as Read"
                    >
                      <MailOpen className="w-3.5 h-3.5" />
                    </button>
                    {activeFolder === 'trash' ? (
                      <button
                        onClick={handleBulkDelete}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg text-[11px] font-bold text-rose-700"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={handleBulkTrash}
                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg text-[11px] font-bold text-rose-700"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-[11px] font-black text-slate-500 ml-1">
                      ({selectedEmailIds.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1">
                {['ALL', 'UNREAD', 'STARRED'].map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilterType(f); setPage(1); }}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all ${
                      filterType === f
                        ? 'bg-crm-navy text-crm-lime'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Email Item Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-crm-lime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Loading {activeFolder} emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Mail className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">No emails in {activeFolder}</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  {activeFolder === 'inbox'
                    ? 'Incoming customer messages and replies will appear here.'
                    : activeFolder === 'sent'
                    ? 'Emails and campaigns you dispatch will be recorded here.'
                    : activeFolder === 'scheduled'
                    ? 'Automated sequence steps and scheduled follow-ups appear here.'
                    : 'Trash is empty.'}
                </p>
                {activeFolder === 'inbox' && (
                  <button
                    onClick={handleSyncInbox}
                    className="mt-2 px-3 py-1.5 bg-crm-navy text-crm-lime text-xs font-bold rounded-xl"
                  >
                    Sync Inbox Now
                  </button>
                )}
              </div>
            ) : (
              emails.map((item) => {
                const isSelected = selectedEmail?._id === item._id;
                const isChecked = selectedEmailIds.includes(item._id);

                const senderDisplayName = item.direction === 'INCOMING'
                  ? (item.from?.name || item.from?.email || 'Unknown')
                  : (item.to[0]?.name || item.to[0]?.email || 'Recipient');

                const dateDisplay = new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });

                const snippetText = item.plainText || (item.body ? item.body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() : '');

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectEmail(item)}
                    className={`p-3 cursor-pointer transition-all flex items-start gap-2.5 select-none relative ${
                      isSelected
                        ? 'bg-crm-navy/5 border-l-4 border-crm-lime font-semibold'
                        : !item.isRead && activeFolder === 'inbox'
                        ? 'bg-blue-50/40 hover:bg-blue-50/70 font-bold'
                        : 'hover:bg-slate-50 font-normal'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleSelectRow(item._id, e)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-3.5 h-3.5 rounded text-crm-navy focus:ring-crm-navy border-slate-300 cursor-pointer shrink-0"
                    />

                    {/* Star Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(item._id, e)}
                      className="mt-0.5 text-slate-300 hover:text-amber-500 transition-colors shrink-0"
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isStarred ? 'text-amber-500 fill-amber-400' : ''}`} />
                    </button>

                    {/* Email Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-xs truncate ${!item.isRead ? 'text-crm-navy font-black' : 'text-slate-800 font-bold'}`}>
                          {senderDisplayName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono whitespace-nowrap">
                          {dateDisplay}
                        </span>
                      </div>

                      <p className={`text-xs truncate ${!item.isRead ? 'text-slate-900 font-black' : 'text-slate-700 font-medium'}`}>
                        {item.subject || '(No Subject)'}
                      </p>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed break-words">
                        {snippetText || '(No content)'}
                      </p>

                      {/* Status Tags */}
                      <div className="flex items-center gap-1 pt-0.5 flex-wrap">
                        {item.sequenceNumber && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 inline-flex items-center gap-0.5">
                            <RotateCcw className="w-2.5 h-2.5" />
                            Follow-Up #{item.sequenceNumber}
                          </span>
                        )}
                        {item.status === 'REPLIED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 inline-flex items-center gap-0.5">
                            <Reply className="w-2.5 h-2.5" />
                            Replied
                          </span>
                        )}
                        {(item.status === 'SCHEDULED' || item.status === 'PENDING') && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 inline-flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {item.scheduledAt ? `Due ${new Date(item.scheduledAt).toLocaleDateString()}` : 'Scheduled'}
                          </span>
                        )}
                        {item.status === 'DENIED' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 inline-flex items-center gap-0.5" title={item.errorMessage || 'Auto-cancelled because recipient replied'}>
                            <AlertCircle className="w-2.5 h-2.5" />
                            Denied (Replied)
                          </span>
                        )}
                        {item.direction === 'OUTGOING' && !item.sequenceNumber && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                            Sent
                          </span>
                        )}
                        {item.folderName && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 bg-slate-100">
                            📁 {item.folderName}
                          </span>
                        )}
                        {item.smtpProvider && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-blue-700 bg-blue-50">
                            {item.smtpProvider}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Email List Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="p-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/80 shrink-0">
              <span className="text-[11px] font-medium">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1 rounded-lg border bg-white hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. Right Reading Pane & Conversation Thread (md:col-span-5 lg:col-span-6) ── */}
        {selectedEmail ? (
          <div className="col-span-1 md:col-span-5 lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 flex flex-col shadow-xs overflow-hidden animate-in fade-in duration-150">
            {/* Header with Email Actions */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="md:hidden p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-crm-navy truncate">
                    {selectedEmail.subject || '(No Subject)'}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {selectedEmailThread.length > 1 ? `${selectedEmailThread.length} Messages in Thread` : 'Single Message'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => handleToggleStar(selectedEmail._id, e)}
                  className="p-1.5 rounded-lg border bg-white hover:bg-slate-100 text-slate-600"
                  title="Star Email"
                >
                  <Star className={`w-4 h-4 ${selectedEmail.isStarred ? 'text-amber-500 fill-amber-400' : ''}`} />
                </button>

                {activeFolder === 'trash' ? (
                  <>
                    <button
                      onClick={() => handleRestoreFromTrash(selectedEmail._id)}
                      className="p-1.5 rounded-lg border bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
                      title="Restore Email"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(selectedEmail._id)}
                      className="p-1.5 rounded-lg border bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                      title="Delete Forever"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={(e) => handleMoveToTrash(selectedEmail._id, e)}
                    className="p-1.5 rounded-lg border bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600"
                    title="Move to Trash"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Conversation Thread History Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Scheduled Follow-Up Info Banner */}
              {(selectedEmail.isScheduledEmailDoc || activeFolder === 'scheduled') && (
                <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                  selectedEmail.status === 'DENIED' || selectedEmail.status === 'CANCELLED'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50/90 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      selectedEmail.status === 'DENIED' || selectedEmail.status === 'CANCELLED' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {selectedEmail.status === 'DENIED' || selectedEmail.status === 'CANCELLED' ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-xs">
                          {selectedEmail.status === 'DENIED' || selectedEmail.status === 'CANCELLED'
                            ? 'Follow-Up Cancelled / Denied'
                            : `Scheduled Follow-Up Email (Step #${selectedEmail.sequenceNumber || 1})`}
                        </h4>
                        {selectedEmail.folderName && (
                          <span className="px-2 py-0.5 bg-white/80 border border-amber-200 rounded-md text-[10px] font-bold">
                            📁 {selectedEmail.folderName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] mt-1 leading-relaxed">
                        {selectedEmail.status === 'DENIED' || selectedEmail.status === 'CANCELLED'
                          ? (selectedEmail.errorMessage || 'This scheduled follow-up was cancelled and will not be dispatched.')
                          : `Scheduled for dispatch on ${new Date(selectedEmail.scheduledAt || selectedEmail.createdAt).toLocaleString()}. Will be cancelled automatically if recipient replies beforehand.`}
                      </p>
                    </div>
                  </div>

                  {selectedEmail.status !== 'DENIED' && selectedEmail.status !== 'CANCELLED' && selectedEmail.status !== 'SENT' && (
                    <button
                      type="button"
                      onClick={(e) => handleCancelFollowUp(selectedEmail._id, e)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs shrink-0 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title="Cancel this follow-up email immediately"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Cancel Follow-Up</span>
                    </button>
                  )}
                </div>
              )}

              {loadingThread ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-crm-lime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Loading conversation thread...</p>
                </div>
              ) : (
                selectedEmailThread.map((msg, idx) => (
                  <div
                    key={msg._id}
                    className={`rounded-2xl p-4 border transition-all ${
                      msg.direction === 'OUTGOING'
                        ? 'bg-slate-50/80 border-slate-200'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    {/* Message Sender Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          msg.direction === 'OUTGOING'
                            ? 'bg-crm-navy text-crm-lime'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {msg.from?.name ? msg.from.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {msg.from?.name || msg.from?.email}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              &lt;{msg.from?.email}&gt;
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">
                            To: {msg.to.map(t => t.name ? `${t.name} <${t.email}>` : t.email).join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(msg.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {msg.smtpProvider && (
                          <span className="block text-[9px] text-slate-400 font-bold uppercase">
                            via {msg.smtpProvider}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Render Formatted HTML / Text Body */}
                    <div
                      className="text-xs leading-relaxed text-slate-800 space-y-2 font-sans overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: msg.body }}
                    />
                  </div>
                ))
              )}

              {/* Inline Quick Reply Box */}
              {activeFolder !== 'trash' && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <form onSubmit={handleSendReply} className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-crm-navy flex items-center gap-1.5">
                        <Reply className="w-3.5 h-3.5 text-crm-lime" />
                        <span>Reply to {selectedEmail.from?.name || selectedEmail.from?.email}</span>
                      </span>
                    </div>

                    <textarea
                      rows="4"
                      required
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      placeholder="Type your manual reply here... Will be sent via your connected SMTP / Outlook."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy font-sans"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-slate-400">
                        Quotes previous message history automatically
                      </p>

                      <button
                        type="submit"
                        disabled={sendingReply || !replyBody.trim()}
                        className="px-4 py-2 bg-crm-navy hover:bg-crm-navy-light text-crm-lime text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
                      >
                        {sendingReply ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-crm-lime border-t-transparent rounded-full animate-spin" />
                            <span>Sending Reply...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Reply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden md:flex md:col-span-5 lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 items-center justify-center p-8 text-center shadow-xs">
            <div className="max-w-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <MailOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-sm font-black text-slate-800">Select an email to view</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose a conversation from the list to read messages, view conversation threads, or type manual replies.
              </p>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="px-4 py-2 bg-crm-navy text-crm-lime text-xs font-black rounded-xl shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Compose New Email</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compose Email Modal */}
      <ComposeEmailModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={() => {
          fetchEmails();
          if (activeFolder !== 'sent') handleSelectFolder('sent');
        }}
      />
    </div>
  );
};
