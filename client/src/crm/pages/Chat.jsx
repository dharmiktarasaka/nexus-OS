import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Users,
  Paperclip,
  X,
  FileText,
  Download,
  RefreshCw,
  Pencil,
  Trash2,
  Check,
  Ban,
  Loader2,
  ChevronDown,
  User,
  Search,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  Bell
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Chat = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeConv, setActiveConv] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [switchingConv, setSwitchingConv] = useState(false);

  // Dropdown & Search state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchEmployee, setSearchEmployee] = useState('');
  const dropdownRef = useRef(null);

  // Edit & Delete state
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getFullFileUrl = (fileUrl) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    const serverOrigin = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '';
    return `${serverOrigin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch employees directory for direct messaging with unread status
  const fetchEmployees = async () => {
    try {
      const res = await api.get('/chat/users');
      if (res.data?.success) {
        setEmployees(res.data.users || []);
      }
    } catch (err) {
      // Quiet fallback
    }
  };

  // Fetch conversations and initialize Company Team Chat by default
  const initConversations = async (preferredConvId = null) => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data?.success) {
        const convList = res.data.conversations || [];
        setConversations(convList);

        if (preferredConvId) {
          const matched = convList.find(c => c._id === preferredConvId);
          if (matched) {
            setActiveConv(matched);
            return;
          }
        }

        if (!activeConv) {
          const mainTeamChat = convList.find(c => c.name === 'Company Team Chat') || convList[0];
          setActiveConv(mainTeamChat);
        }
      }
    } catch (err) {
      showError('Failed to initialize chat conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/chat/conversations/${convId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'auto' }), 100);

        // Mark as read in state
        setConversations(prev =>
          prev.map(c => c._id === convId ? { ...c, unreadCount: 0 } : c)
        );
      }
    } catch (err) {
      showError('Failed to load message history');
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    initConversations();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeConv?._id) {
      fetchMessages(activeConv._id);
    }
  }, [activeConv?._id]);

  // Real-time fast polling for messages & unread notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Fetch current conversation messages
      if (activeConv?._id) {
        api.get(`/chat/conversations/${activeConv._id}/messages`).then(res => {
          if (res.data?.success) {
            setMessages(prev => {
              const newMsgs = res.data.messages || [];
              if (JSON.stringify(newMsgs) !== JSON.stringify(prev)) {
                return newMsgs;
              }
              return prev;
            });
          }
        }).catch(() => {});
      }

      // 2. Refresh unread counts & teammate lists
      api.get('/chat/conversations').then(res => {
        if (res.data?.success) {
          setConversations(res.data.conversations || []);
        }
      }).catch(() => {});

      api.get('/chat/users').then(res => {
        if (res.data?.success) {
          setEmployees(res.data.users || []);
        }
      }).catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [activeConv?._id]);

  // Helper to extract the direct partner's info
  const getDirectPartner = (conv) => {
    if (!conv || conv.type !== 'DIRECT') return null;
    const currentUserId = String(currentUser?.id || currentUser?._id);
    return conv.participants?.find(p => String(p._id || p) !== currentUserId);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  // Switch to Company Team Chat
  const handleSelectTeamChat = async () => {
    const teamChat = conversations.find(c => c.name === 'Company Team Chat' || c.type === 'GROUP');
    if (teamChat) {
      setActiveConv(teamChat);
      try {
        await api.post(`/chat/conversations/${teamChat._id}/read`);
      } catch (e) {}
    } else {
      initConversations();
    }
    setIsDropdownOpen(false);
    setSearchEmployee('');
  };

  // Switch or create Personal 1-on-1 Chat with chosen employee
  const handleSelectEmployee = async (employee) => {
    if (!employee || !employee._id) return;
    setIsDropdownOpen(false);
    setSearchEmployee('');
    setSwitchingConv(true);

    try {
      const res = await api.post('/chat/conversations', {
        participantIds: [employee._id],
        type: 'DIRECT'
      });

      if (res.data?.success && res.data.conversation) {
        const conv = res.data.conversation;
        setActiveConv(conv);

        // Optimistically clear unread count for this employee in state
        setEmployees(prev =>
          prev.map(e => e._id === employee._id ? { ...e, unreadCount: 0 } : e)
        );

        setConversations(prev => {
          const exists = prev.some(c => c._id === conv._id);
          if (exists) {
            return prev.map(c => c._id === conv._id ? { ...conv, unreadCount: 0 } : c);
          }
          return [{ ...conv, unreadCount: 0 }, ...prev];
        });

        // Mark as read in backend
        try {
          await api.post(`/chat/conversations/${conv._id}/read`);
        } catch (e) {}
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to open personal chat');
    } finally {
      setSwitchingConv(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      showError('File size exceeds 50MB limit');
      return;
    }
    setSelectedFile(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !activeConv) return;

    setSending(true);
    let attachments = [];

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const upRes = await api.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (upRes.data?.attachment) {
          attachments.push(upRes.data.attachment);
        }
      }

      const text = messageInput.trim();
      const res = await api.post(`/chat/conversations/${activeConv._id}/messages`, {
        content: text,
        attachments
      });

      if (res.data?.success) {
        setMessages(prev => [...prev, res.data.message]);
        setMessageInput('');
        handleClearFile();
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Edit Message Handlers
  const handleStartEdit = (msg) => {
    if (msg.attachments && msg.attachments.length > 0) {
      showError('Media and document attachments cannot be edited. You can only delete document messages.');
      return;
    }
    setEditingMsgId(msg._id);
    setEditText(msg.content || '');
  };

  const handleCancelEdit = () => {
    setEditingMsgId(null);
    setEditText('');
  };

  const handleSaveEdit = async (msgId) => {
    if (!editText.trim()) {
      showError('Message content cannot be empty');
      return;
    }
    setSavingEdit(true);
    try {
      const res = await api.put(`/chat/messages/${msgId}`, { content: editText.trim() });
      if (res.data?.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? res.data.message : m));
        showSuccess('Message updated successfully');
        handleCancelEdit();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to edit message');
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Message Handler
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    setDeletingMsgId(msgId);
    try {
      const res = await api.delete(`/chat/messages/${msgId}`);
      if (res.data?.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? res.data.message : m));
        showSuccess('Message deleted');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete message');
    } finally {
      setDeletingMsgId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const directPartner = getDirectPartner(activeConv);
  const isDirect = activeConv?.type === 'DIRECT' && directPartner;
  const chatDisplayName = isDirect
    ? directPartner.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Direct Chat'
    : 'Company Team Chat';

  const teamChatConv = conversations.find(c => c.name === 'Company Team Chat' || c.type === 'GROUP');
  const teamChatUnread = !isDirect ? 0 : (teamChatConv?.unreadCount || 0);

  // Calculate unread messages in other chats/employees
  const otherEmployeesUnread = employees
    .filter(emp => !isDirect || String(emp._id) !== String(directPartner?._id))
    .reduce((sum, emp) => sum + (emp.unreadCount || 0), 0);

  const totalOtherUnread = teamChatUnread + otherEmployeesUnread;

  const filteredEmployees = employees.filter(emp => {
    if (!searchEmployee.trim()) return true;
    const q = searchEmployee.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.role?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="h-full w-full bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-950 flex flex-col overflow-hidden text-slate-100 animate-in fade-in duration-300">
      {/* Top Header with Chat Selector Dropdown */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shadow-xs relative z-30">
        <div className="relative" ref={dropdownRef}>
          {/* Header Chat Button Trigger */}
          <button
            onClick={() => setIsDropdownOpen(prev => !prev)}
            className="flex items-center gap-3 text-left hover:bg-slate-800/80 p-1.5 -m-1.5 rounded-2xl transition-all group focus:outline-none focus:ring-2 focus:ring-crm-lime/40"
          >
            {isDirect ? (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-black flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                {getInitials(directPartner.name)}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-crm-lime text-crm-navy text-sm font-black flex items-center justify-center shadow-md shadow-crm-lime/20 shrink-0">
                <Users className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-wide group-hover:text-crm-lime transition-colors flex items-center gap-1.5">
                  {chatDisplayName}
                </h3>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 group-hover:text-crm-lime transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-crm-lime' : ''
                  }`}
                />

                {/* Other Conversations Pending Unread Badge */}
                {totalOtherUnread > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white shadow-xs shadow-rose-500/50 animate-pulse">
                    {totalOtherUnread} pending
                  </span>
                )}
              </div>
              <p className="text-xs text-crm-lime font-bold flex items-center gap-1.5">
                {isDirect ? (
                  <span>Direct Message • {directPartner.role || 'Member'}</span>
                ) : (
                  <span>{activeConv?.participants?.length || 0} Connected Members • Real-time Team Channel</span>
                )}
              </p>
            </div>
          </button>

          {/* Teammates & Channel Selection Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-3 w-84 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2.5 z-50 text-slate-200 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              {/* Search Teammates Input */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchEmployee}
                  onChange={(e) => setSearchEmployee(e.target.value)}
                  placeholder="Search teammates..."
                  className="w-full pl-8.5 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-crm-lime"
                  autoFocus
                />
              </div>

              {/* Main Team Channel Option */}
              <div className="mb-2">
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                  <span>Team Channels</span>
                </div>
                <button
                  onClick={handleSelectTeamChat}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                    !isDirect
                      ? 'bg-crm-lime/15 text-crm-lime border border-crm-lime/30 font-bold'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-crm-lime text-crm-navy flex items-center justify-center font-black shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">Company Team Chat</div>
                      <div className="text-[10px] text-slate-400 truncate">Public company-wide channel</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {teamChatConv?.unreadCount > 0 && isDirect && (
                      <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-crm-lime text-crm-navy">
                        {teamChatConv.unreadCount} new
                      </span>
                    )}
                    {!isDirect && <Check className="w-4 h-4 text-crm-lime shrink-0" />}
                  </div>
                </button>
              </div>

              {/* Teammates / Direct Messages List */}
              <div>
                <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                  <span>Direct Messages ({filteredEmployees.length})</span>
                  <span className="text-[9px] text-slate-400 lowercase font-medium">1-on-1 personal</span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {filteredEmployees.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No teammates found</p>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isCurrentPartner = isDirect && String(directPartner?._id) === String(emp._id);
                      const cleanEmpName = emp.name?.replace(/\s*\([^)]*\)/g, '').trim() || 'Employee';
                      const hasUnread = emp.unreadCount > 0 && !isCurrentPartner;

                      return (
                        <button
                          key={emp._id}
                          onClick={() => handleSelectEmployee(emp)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                            isCurrentPartner
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
                              : hasUnread
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-slate-200'
                              : 'hover:bg-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 relative">
                              {getInitials(cleanEmpName)}
                              {hasUnread && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate text-slate-100 flex items-center gap-1.5">
                                <span>{cleanEmpName}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                                <span>{emp.role || 'Member'}</span>
                                <span>•</span>
                                <span className="truncate">{emp.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {hasUnread && (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-rose-500 text-white shadow-xs shadow-rose-500/50 animate-pulse">
                                {emp.unreadCount} pending
                              </span>
                            )}
                            {isCurrentPartner && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex items-center gap-2">
          {switchingConv && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-crm-lime" />
              <span>Switching...</span>
            </div>
          )}
          <button
            onClick={() => fetchMessages(activeConv?._id)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="Refresh chat messages"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Black Background Messages Stream Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {loadingMsgs ? (
          <p className="text-xs text-slate-500 text-center py-12">Loading conversation history...</p>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            {isDirect ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-white">Direct Chat with {chatDisplayName} Ready</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Start your private 1-on-1 conversation with {chatDisplayName}. Send messages, images, audio, video, or files.
                </p>
              </>
            ) : (
              <>
                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto" />
                <h3 className="text-sm font-extrabold text-white">Company Chat Room Ready</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Welcome to the Company Team Chat! Send messages, images, videos, audio, or documents to communicate with everyone.
                </p>
              </>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const senderId = msg.sender?._id || msg.sender;
            const isMe = String(senderId) === String(currentUser?.id || currentUser?._id);
            const isAdmin = currentUser?.role === 'ADMIN';
            const rawName = msg.sender?.name || (isMe ? 'You' : 'User');
            const cleanName = rawName.replace(/\s*\([^)]*\)/g, '').trim();
            const hasAttachments = msg.attachments && msg.attachments.length > 0;
            const isEditing = editingMsgId === msg._id;

            return (
              <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-extrabold text-slate-200">{cleanName}</span>
                  <span>•</span>
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {msg.isEdited && !msg.isDeleted && (
                    <span className="text-[10px] text-slate-500 italic font-semibold">(edited)</span>
                  )}
                </div>

                {/* Message Container with Action Icons on Hover */}
                <div className="relative flex items-center gap-2 max-w-lg group">
                  {/* Action Menu (Edit / Delete) for Message Senders & Admins */}
                  {!msg.isDeleted && !isEditing && (isMe || isAdmin) && (
                    <div
                      className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-lg ${
                        isMe ? 'order-first' : 'order-last'
                      }`}
                    >
                      {/* EDIT button: Only for text messages (NO attachments) sent by user */}
                      {isMe && !hasAttachments && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="p-1.5 text-slate-400 hover:text-crm-lime hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* DELETE button: For any message sent by user or admin */}
                      {(isMe || isAdmin) && (
                        <button
                          onClick={() => handleDeleteMessage(msg._id)}
                          disabled={deletingMsgId === msg._id}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Message"
                        >
                          {deletingMsgId === msg._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Message Content Bubble */}
                  {msg.isDeleted ? (
                    <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-slate-500 italic text-xs flex items-center gap-2 font-medium">
                      <Ban className="w-4 h-4 text-slate-600 shrink-0" />
                      <span>This message was deleted</span>
                    </div>
                  ) : isEditing ? (
                    /* Inline Editing Text Box */
                    <div className="p-3 rounded-2xl w-full max-w-lg bg-white border-2 border-crm-lime shadow-xl space-y-2 text-slate-900">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs font-semibold text-slate-900 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-crm-navy resize-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 font-bold text-[11px] rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(msg._id)}
                          disabled={savingEdit || !editText.trim()}
                          className="flex items-center gap-1 px-3 py-1 bg-crm-navy text-white hover:bg-slate-800 text-[11px] font-extrabold rounded-lg shadow-xs transition-colors"
                        >
                          {savingEdit ? <Loader2 className="w-3 h-3 animate-spin text-crm-lime" /> : <Check className="w-3 h-3 text-crm-lime" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard White Message Text & Attachment Bubble */
                    <div
                      className={`p-3.5 rounded-2xl w-full shadow-md space-y-2 text-xs bg-white text-slate-900 border border-slate-200 font-semibold ${
                        isMe ? 'rounded-br-none' : 'rounded-bl-none'
                      }`}
                    >
                      {/* Text Message Content */}
                      {msg.content && <p className="leading-relaxed text-slate-900 whitespace-pre-wrap">{msg.content}</p>}

                      {/* Media & Document Attachments */}
                      {hasAttachments && (
                        <div className="space-y-2 pt-1 border-t border-slate-200">
                          {msg.attachments.map((att, idx) => {
                            const fullUrl = getFullFileUrl(att.fileUrl);

                            if (att.fileType === 'image') {
                              return (
                                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 relative group bg-slate-100">
                                  <img
                                    src={fullUrl}
                                    alt={att.fileName}
                                    className="max-h-80 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(fullUrl, '_blank')}
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180" fill="%23f1f5f9"><rect width="300" height="180" fill="%23f8fafc"/><text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2364748b">📷 Image Unavailable</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%2394a3b8">Legacy file before database sync</text></svg>';
                                    }}
                                  />
                                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-700 truncate">{att.fileName}</span>
                                    <a
                                      href={fullUrl}
                                      download={att.fileName || 'photo.jpg'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2.5 py-1 bg-crm-navy text-white text-[11px] font-extrabold rounded-lg hover:bg-crm-navy-light transition-colors shrink-0 shadow-2xs"
                                      title="Download Photo"
                                    >
                                      <Download className="w-3.5 h-3.5 text-crm-lime" />
                                      Download Photo
                                    </a>
                                  </div>
                                </div>
                              );
                            } else if (att.fileType === 'video') {
                              return (
                                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-black">
                                  <video controls src={fullUrl} className="w-full max-h-72 rounded-xl" />
                                  <div className="p-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-700 truncate">{att.fileName}</span>
                                    <a
                                      href={fullUrl}
                                      download={att.fileName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2.5 py-1 bg-crm-navy text-white text-[11px] font-extrabold rounded-lg hover:bg-crm-navy-light transition-colors shrink-0"
                                    >
                                      <Download className="w-3.5 h-3.5 text-crm-lime" />
                                      Download Video
                                    </a>
                                  </div>
                                </div>
                              );
                            } else if (att.fileType === 'audio') {
                              return (
                                <div key={idx} className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 space-y-1">
                                  <audio controls src={fullUrl} className="w-full h-8" />
                                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-600 truncate">{att.fileName}</span>
                                    <a
                                      href={fullUrl}
                                      download={att.fileName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      Download
                                    </a>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={idx} className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-slate-900">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 truncate">{att.fileName}</p>
                                      <p className="text-[10px] text-slate-500">{formatFileSize(att.fileSize)}</p>
                                    </div>
                                  </div>
                                  <a
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="p-2 rounded-lg bg-crm-navy text-white hover:bg-crm-navy-light transition-colors shrink-0"
                                    title="Download Document"
                                  >
                                    <Download className="w-4 h-4 text-crm-lime" />
                                  </a>
                                </div>
                              );
                            }
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview Banner */}
      {selectedFile && (
        <div className="px-5 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 text-xs text-crm-lime">
          <div className="flex items-center gap-2 truncate">
            <Paperclip className="w-4 h-4 shrink-0" />
            <span className="font-bold truncate">{selectedFile.name}</span>
            <span className="text-[10px] text-slate-400">({formatFileSize(selectedFile.size)})</span>
          </div>
          <button onClick={handleClearFile} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom Message Composer Input Bar */}
      <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.csv"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 text-slate-400 hover:text-crm-lime hover:bg-slate-800 rounded-xl transition-colors shrink-0"
          title="Attach Image, Video, Audio, or Document"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder={isDirect ? `Message ${chatDisplayName} directly...` : "Type a message to the team..."}
          className="flex-1 px-4 py-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-crm-lime"
        />

        <button
          type="submit"
          disabled={(!messageInput.trim() && !selectedFile) || sending}
          className="p-3 bg-crm-lime text-crm-navy font-bold rounded-xl shadow-lg hover:bg-crm-lime-hover disabled:opacity-50 transition-all shrink-0"
        >
          {sending ? <div className="w-4 h-4 border-2 border-crm-navy border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};
