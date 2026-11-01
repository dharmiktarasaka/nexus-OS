import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { UserPlus, Copy, CheckCircle2, ShieldCheck, Folder } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const InviteUserModal = ({ isOpen, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'EMPLOYEE'
  });

  const [folders, setFolders] = useState([]);
  const [selectedFolderAccess, setSelectedFolderAccess] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', role: 'EMPLOYEE' });
      setCreatedInviteLink('');
      setCopied(false);
      setSelectedFolderAccess({});

      // Fetch company folders to present checklist
      api.get('/folders')
        .then(res => {
          if (res.data?.folders) setFolders(res.data.folders);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleFolderToggle = (folderId, accessLevel) => {
    setSelectedFolderAccess(prev => {
      const updated = { ...prev };
      if (!accessLevel) {
        delete updated[folderId];
      } else {
        updated[folderId] = accessLevel;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showError('Name and Email are required');
      return;
    }

    setSubmitting(true);
    try {
      const folderAccessArr = Object.entries(selectedFolderAccess).map(([fId, lvl]) => ({
        folderId: fId,
        accessLevel: lvl
      }));

      const res = await api.post('/users/invite', {
        ...formData,
        folderAccess: folderAccessArr
      });

      if (res.data?.success) {
        showSuccess(res.data.message || 'Invitation created successfully');
        if (res.data.invitationLink) {
          setCreatedInviteLink(res.data.invitationLink);
        }
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create user invitation');
    } finally {
      setSubmitting(false);
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
      title="Invite Team Member / User"
      maxWidth="max-w-2xl"
    >
      {createdInviteLink ? (
        <div className="space-y-5 text-center py-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-crm-navy">Invitation Token Generated!</h3>
            <p className="text-xs text-slate-500 mt-1">Share this invitation link with {formData.email} to let them create their password securely.</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 max-w-lg mx-auto">
            <span className="text-xs font-mono text-slate-700 truncate">{createdInviteLink}</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-1.5 bg-crm-lime text-crm-navy font-bold text-xs rounded-lg shrink-0 shadow-2xs hover:bg-crm-lime-hover"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-crm-navy bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Done & Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-crm-navy mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Anjali Sharma"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-crm-navy mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. anjali@company.com"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-crm-navy mb-1.5">Assign User Role *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`p-3 border rounded-xl cursor-pointer transition-all ${formData.role === 'MANAGER' ? 'border-crm-lime bg-crm-lime/10 font-bold' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="userRole"
                  value="MANAGER"
                  checked={formData.role === 'MANAGER'}
                  onChange={() => setFormData({ ...formData, role: 'MANAGER' })}
                  className="hidden"
                />
                <p className="text-xs font-bold text-crm-navy">Manager</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Manage team, create & share folders</p>
              </label>

              <label className={`p-3 border rounded-xl cursor-pointer transition-all ${formData.role === 'EMPLOYEE' ? 'border-crm-lime bg-crm-lime/10 font-bold' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="userRole"
                  value="EMPLOYEE"
                  checked={formData.role === 'EMPLOYEE'}
                  onChange={() => setFormData({ ...formData, role: 'EMPLOYEE' })}
                  className="hidden"
                />
                <p className="text-xs font-bold text-crm-navy">Employee</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Own private data + assigned folders</p>
              </label>

              <label className={`p-3 border rounded-xl cursor-pointer transition-all ${formData.role === 'VISITOR' ? 'border-crm-lime bg-crm-lime/10 font-bold' : 'border-slate-200 bg-white'}`}>
                <input
                  type="radio"
                  name="userRole"
                  value="VISITOR"
                  checked={formData.role === 'VISITOR'}
                  onChange={() => setFormData({ ...formData, role: 'VISITOR' })}
                  className="hidden"
                />
                <p className="text-xs font-bold text-crm-navy">Visitor (Read-Only)</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Read + Search + Filter + Export only</p>
              </label>
            </div>
          </div>

          {/* Folder Access Checklist */}
          {folders.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-crm-navy">
                Grant Initial Folder Access (Optional):
              </label>
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {folders.map(f => {
                  const currentLvl = selectedFolderAccess[f._id] || '';

                  return (
                    <div key={f._id} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-crm-navy shrink-0" />
                        <span className="font-bold text-crm-navy truncate max-w-[180px]">{f.name}</span>
                      </div>

                      <select
                        value={currentLvl}
                        onChange={(e) => handleFolderToggle(f._id, e.target.value)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">No Access</option>
                        <option value="VIEW">VIEW</option>
                        <option value="VIEW_EXPORT">VIEW + EXPORT</option>
                        <option value="EDIT">EDIT</option>
                        <option value="FULL_ACCESS">FULL ACCESS</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              {submitting ? 'Generating Invitation...' : 'Send Invitation Link'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
