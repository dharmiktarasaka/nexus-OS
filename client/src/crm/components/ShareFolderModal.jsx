import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, User, Users, UserPlus, Copy, CheckCircle2, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const ShareFolderModal = ({ isOpen, onClose, folderId, folderName, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'invite'

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab 1 State: Existing Member
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('VIEW_EXPORT');
  const [submittingExisting, setSubmittingExisting] = useState(false);

  // Tab 2 State: Invite New Person
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VISITOR');
  const [inviteAccessLevel, setInviteAccessLevel] = useState('VIEW_EXPORT');
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data?.users) setUsers(res.data.users);
    } catch (err) {
      showError('Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && folderId) {
      fetchUsers();
      setActiveTab('existing');
      setSelectedUserId('');
      setInviteName('');
      setInviteEmail('');
      setCreatedInviteLink('');
      setCopied(false);
    }
  }, [isOpen, folderId]);

  // Grant folder access to existing user
  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
      showError('Please select a team member');
      return;
    }

    setSubmittingExisting(true);
    try {
      const res = await api.post(`/users/${selectedUserId}/folder-access`, {
        folderId,
        accessLevel: selectedAccessLevel
      });
      if (res.data?.success) {
        showSuccess(res.data.message || 'Folder shared successfully');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to grant folder access');
    } finally {
      setSubmittingExisting(false);
    }
  };

  // Invite new person as Visitor or Employee with initial folder access
  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showError('Name and Email are required');
      return;
    }

    setSubmittingInvite(true);
    try {
      const res = await api.post('/users/invite', {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        folderAccess: [{
          folderId,
          accessLevel: inviteAccessLevel
        }]
      });

      if (res.data?.success) {
        showSuccess(`Invitation created for ${inviteEmail}`);
        if (res.data.invitationLink) {
          setCreatedInviteLink(res.data.invitationLink);
        }
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to generate invitation link');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCopyLink = () => {
    if (createdInviteLink) {
      navigator.clipboard.writeText(createdInviteLink);
      setCopied(true);
      showSuccess('Invitation link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Share Folder "${folderName}"`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('existing')}
            className={`pb-2 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'existing'
                ? 'border-crm-navy text-crm-navy font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Existing Team Member
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-2 px-4 flex items-center gap-1.5 transition-colors border-b-2 ${
              activeTab === 'invite'
                ? 'border-crm-navy text-crm-navy font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite New Visitor / User
          </button>
        </div>

        {/* Tab 1: Existing Member */}
        {activeTab === 'existing' && (
          <form onSubmit={handleGrantAccess} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <h4 className="text-xs font-extrabold text-crm-navy flex items-center gap-2">
              <Users className="w-4 h-4 text-crm-lime" />
              Share with Registered CRM Member
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Select User *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold text-crm-navy"
                >
                  <option value="">-- Choose User --</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Access Level *</label>
                <select
                  value={selectedAccessLevel}
                  onChange={(e) => setSelectedAccessLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold text-crm-navy"
                >
                  <option value="VIEW">VIEW (Read-only)</option>
                  <option value="VIEW_EXPORT">VIEW + EXPORT</option>
                  <option value="EDIT">EDIT (View, Upload, Add, Edit)</option>
                  <option value="FULL_ACCESS">FULL ACCESS (Edit, Share)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={submittingExisting}
                className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs disabled:opacity-50"
              >
                {submittingExisting ? 'Sharing...' : 'Share Folder'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Invite New Person */}
        {activeTab === 'invite' && (
          <div className="space-y-4">
            {createdInviteLink ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-crm-navy">Invitation Token Generated!</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Send this link to {inviteEmail}. Once they set their password, they will get {inviteAccessLevel} access to "{folderName}".</p>
                </div>

                <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2 max-w-md mx-auto">
                  <span className="text-[11px] font-mono text-slate-700 truncate">{createdInviteLink}</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-1 bg-crm-lime text-crm-navy font-bold text-xs rounded-lg shrink-0 shadow-2xs hover:bg-crm-lime-hover"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteUser} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <h4 className="text-xs font-extrabold text-crm-navy flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-crm-lime" />
                  Invite New Person to View / Export Folder
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      placeholder="e.g. Employee B / Guest"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="e.g. visitor@company.com"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Account Role *</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold text-crm-navy"
                    >
                      <option value="VISITOR">Visitor (Read-Only + Export)</option>
                      <option value="EMPLOYEE">Employee (Standard Member)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Folder Access Level *</label>
                    <select
                      value={inviteAccessLevel}
                      onChange={(e) => setInviteAccessLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold text-crm-navy"
                    >
                      <option value="VIEW_EXPORT">VIEW + EXPORT</option>
                      <option value="VIEW">VIEW (Read-only)</option>
                      <option value="EDIT">EDIT (View, Upload, Add, Edit)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs disabled:opacity-50"
                  >
                    {submittingInvite ? 'Generating Link...' : 'Generate Invitation Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
