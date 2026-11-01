import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Folder,
  CheckCircle2,
  XCircle,
  MoreVertical,
  Pencil,
  Check,
  X
} from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { InviteUserModal } from '../components/InviteUserModal';
import { UserAccessModal } from '../components/UserAccessModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Users = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Inline User Name Editing State
  const [editingUserId, setEditingUserId] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Modals
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUserIdForAccess, setSelectedUserIdForAccess] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setUsers(res.data.users || []);
      }
    } catch (err) {
      showError('Failed to fetch company users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStartEditName = (u) => {
    setEditingUserId(u._id);
    setEditNameValue(u.name || '');
  };

  const handleSaveUserName = async (userId) => {
    if (!editNameValue || !editNameValue.trim()) {
      showError('User name cannot be empty');
      return;
    }

    setSavingName(true);
    try {
      const res = await api.put(`/users/${userId}`, {
        name: editNameValue.trim()
      });

      if (res.data?.success) {
        showSuccess(`User name updated to "${editNameValue.trim()}"`);
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, name: editNameValue.trim() } : u));
        setEditingUserId(null);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user name');
    } finally {
      setSavingName(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Are you sure you want to remove user "${u.name}" from CRM?`)) return;
    try {
      const res = await api.delete(`/users/${u._id}`);
      if (res.data?.success) {
        showSuccess('User account deleted');
        fetchUsers();
      }
    } catch (err) {
      showError('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const canInvite = currentUser?.role === 'ADMIN' || currentUser?.permissions?.users?.invite;
  const canManage = currentUser?.role === 'ADMIN' || currentUser?.permissions?.users?.manage;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-xl border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Team User Management & RBAC</h2>
          <p className="text-xs text-slate-300 mt-1">Manage user roles, folder permissions, invitation links, and access controls</p>
        </div>

        {canInvite && (
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-crm-lime text-crm-navy font-extrabold text-xs rounded-xl shadow-lg hover:bg-crm-lime-hover transition-all"
          >
            <UserPlus className="w-4 h-4" />
            + Invite New User
          </button>
        )}
      </div>

      {/* Search Filter Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
          />
        </div>

        <p className="text-xs font-extrabold text-slate-500 hidden sm:block">
          Total {users.length} Company Accounts
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading team members..." />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No team users match your current filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Granted Folders</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const isMe = u._id === currentUser.id;

                  let roleBadgeStyle = 'bg-slate-100 text-slate-700';
                  if (u.role === 'ADMIN') roleBadgeStyle = 'bg-crm-navy text-crm-lime font-black';
                  else if (u.role === 'MANAGER') roleBadgeStyle = 'bg-blue-100 text-blue-800 font-bold';
                  else if (u.role === 'EMPLOYEE' || u.role === 'SALES') roleBadgeStyle = 'bg-emerald-100 text-emerald-800 font-bold';
                  else if (u.role === 'VISITOR') roleBadgeStyle = 'bg-amber-100 text-amber-800 font-bold';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-crm-lime/20 text-crm-navy font-bold flex items-center justify-center border border-crm-lime/30 text-xs shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            {editingUserId === u._id ? (
                              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editNameValue}
                                  onChange={(e) => setEditNameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveUserName(u._id);
                                    if (e.key === 'Escape') setEditingUserId(null);
                                  }}
                                  autoFocus
                                  placeholder="User Name"
                                  className="px-2 py-0.5 text-xs font-black text-crm-navy bg-white border border-blue-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveUserName(u._id)}
                                  disabled={savingName}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                  title="Save Name (Enter)"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingUserId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                                  title="Cancel (Esc)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group">
                                <p className="font-extrabold text-crm-navy flex items-center gap-1.5">
                                  {u.name}
                                  {isMe && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">(You)</span>}
                                </p>
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditName(u)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all flex items-center gap-0.5"
                                    title="Click pencil to rename user"
                                  >
                                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                                  </button>
                                )}
                              </div>
                            )}
                            <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider ${roleBadgeStyle}`}>
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3" /> Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-extrabold">
                          <Folder className="w-3.5 h-3.5 text-crm-navy" />
                          <span>{u.grantedFolderCount || 0} Folders</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                            <button
                              onClick={() => setSelectedUserIdForAccess(u._id)}
                              className="px-3 py-1 bg-slate-100 text-crm-navy text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"
                              title="Edit Permissions & Role"
                            >
                              <Pencil className="w-3 h-3 text-slate-500" />
                              <span>Edit Rules</span>
                            </button>
                          )}
                          {!isMe && currentUser?.role === 'ADMIN' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchUsers}
      />

      {/* User Access Modal */}
      {selectedUserIdForAccess && (
        <UserAccessModal
          isOpen={Boolean(selectedUserIdForAccess)}
          onClose={() => setSelectedUserIdForAccess(null)}
          userId={selectedUserIdForAccess}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
};
