import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, UserCheck, Lock, AlertTriangle, Pencil, Check, X } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const UserAccessModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const { showSuccess, showError } = useToast();

  const [targetUser, setTargetUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [role, setRole] = useState('EMPLOYEE');
  const [permissions, setPermissions] = useState({});
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchUserInfo = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}`);
      if (res.data?.success) {
        setTargetUser(res.data.user);
        setUserName(res.data.user.name || '');
        setRole(res.data.user.role || 'EMPLOYEE');
        setPermissions(res.data.user.permissions || {});
        setIsActive(res.data.user.isActive !== false);
      }
    } catch (err) {
      showError('Failed to fetch user permissions');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserInfo();
      setIsEditingName(false);
    }
  }, [isOpen, userId]);

  const handlePermissionToggle = (category, action) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [action]: !(prev[category] ? prev[category][action] : false)
      }
    }));
  };

  const handleSavePermissions = async (e) => {
    e.preventDefault();
    if (!userName || !userName.trim()) {
      showError('User name cannot be empty');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Save name, role & permissions
      await api.put(`/users/${userId}/permissions`, {
        name: userName.trim(),
        role,
        permissions
      });

      // 2. Save active status
      if (targetUser && targetUser.isActive !== isActive) {
        await api.patch(`/users/${userId}/status`, { isActive });
      }

      showSuccess(`User profile and access rules updated successfully`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update user access rules');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Access & Permissions for ${userName || targetUser?.name || 'User'}`}
      maxWidth="max-w-3xl"
    >
      {loading || !targetUser ? (
        <div className="p-8 text-center text-xs text-slate-400 font-semibold">Loading user permissions...</div>
      ) : (
        <form onSubmit={handleSavePermissions} className="space-y-5">
          {/* Top Info Bar with Editable Name & Pencil Button */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex-1 min-w-[200px]">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 mb-1">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="User Full Name"
                    autoFocus
                    className="px-2.5 py-1 text-xs font-black text-crm-navy bg-white border border-crm-navy/40 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!userName.trim()) {
                        showError('User name cannot be empty');
                        return;
                      }
                      setIsEditingName(false);
                    }}
                    className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                    title="Set Name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserName(targetUser.name || '');
                      setIsEditingName(false);
                    }}
                    className="p-1 text-slate-400 hover:bg-slate-200 rounded-md transition-colors"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-black text-sm text-crm-navy">{userName || targetUser.name}</p>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-slate-400 hover:text-crm-navy hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                    title="Click pencil to edit user name"
                  >
                    <Pencil className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-blue-600 underline">Edit Name</span>
                  </button>
                </div>
              )}
              <p className="text-slate-400 text-[11px] font-mono">{targetUser.email}</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-crm-navy focus:ring-crm-navy/20"
                />
                <span className={isActive ? 'text-emerald-700 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {isActive ? 'Account Active' : 'Account Disabled'}
                </span>
              </label>

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-3 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-crm-navy"
              >
                <option value="ADMIN">Owner / Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="VISITOR">Visitor (Read-Only)</option>
              </select>
            </div>
          </div>

          {/* Granular Permissions Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-crm-navy flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-crm-lime" />
              Granular Permission Controls:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Users Perms */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                <p className="text-xs font-bold text-crm-navy border-b border-slate-200 pb-1">User Management</p>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {['view', 'invite', 'manage', 'delete'].map(act => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions.users && permissions.users[act])}
                        onChange={() => handlePermissionToggle('users', act)}
                        className="rounded text-crm-navy"
                      />
                      <span>{act} Users</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Folders Perms */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                <p className="text-xs font-bold text-crm-navy border-b border-slate-200 pb-1">Folder Operations</p>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {['create', 'view', 'edit', 'delete', 'share'].map(act => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions.folders && permissions.folders[act])}
                        onChange={() => handlePermissionToggle('folders', act)}
                        className="rounded text-crm-navy"
                      />
                      <span>{act} Folders</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Datasets Perms */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                <p className="text-xs font-bold text-crm-navy border-b border-slate-200 pb-1">Excel Datasets</p>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {['view', 'upload', 'edit', 'delete', 'export'].map(act => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions.datasets && permissions.datasets[act])}
                        onChange={() => handlePermissionToggle('datasets', act)}
                        className="rounded text-crm-navy"
                      />
                      <span>{act} Datasets</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Records Perms */}
              <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-2">
                <p className="text-xs font-bold text-crm-navy border-b border-slate-200 pb-1">Dynamic Records</p>
                <div className="space-y-1.5 text-slate-700 text-xs">
                  {['view', 'create', 'edit', 'delete', 'export'].map(act => (
                    <label key={act} className="flex items-center gap-2 cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={Boolean(permissions.records && permissions.records[act])}
                        onChange={() => handlePermissionToggle('records', act)}
                        className="rounded text-crm-navy"
                      />
                      <span>{act} Records</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving Rules...' : 'Save Permissions'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
