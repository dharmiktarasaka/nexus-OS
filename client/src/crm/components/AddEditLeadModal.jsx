import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const AddEditLeadModal = ({ isOpen, onClose, lead = null, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    alternatePhone: '',
    email: '',
    service: 'Website Development',
    source: 'Google Ads',
    status: 'NEW',
    priority: 'MEDIUM',
    value: 0,
    assignedTo: '',
    nextFollowUp: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch users for dropdown
      api.get('/users')
        .then((uRes) => {
          if (uRes.data?.users) setUsers(uRes.data.users);
        })
        .catch(() => {});

      if (lead) {
        setFormData({
          name: lead.name || '',
          companyName: lead.companyName || '',
          phone: lead.phone || '',
          alternatePhone: lead.alternatePhone || '',
          email: lead.email || '',
          service: lead.service || 'Website Development',
          source: lead.source || 'Google Ads',
          status: lead.status || 'NEW',
          priority: lead.priority || 'MEDIUM',
          value: lead.value || 0,
          assignedTo: lead.assignedTo?._id || lead.assignedTo || '',
          nextFollowUp: lead.nextFollowUp ? new Date(lead.nextFollowUp).toISOString().split('T')[0] : '',
          notes: lead.notes || ''
        });
      } else {
        setFormData({
          name: '',
          companyName: '',
          phone: '',
          alternatePhone: '',
          email: '',
          service: 'Website Development',
          source: 'Google Ads',
          status: 'NEW',
          priority: 'MEDIUM',
          value: 0,
          assignedTo: '',
          nextFollowUp: '',
          notes: ''
        });
      }
    }
  }, [isOpen, lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      showError('Lead Name and Phone number are required');
      return;
    }

    setSubmitting(true);
    try {
      if (lead?._id) {
        await api.put(`/leads/${lead._id}`, formData);
        showSuccess('Lead updated successfully');
      } else {
        await api.post('/leads', formData);
        showSuccess('Lead created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save lead record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Edit Lead Record' : 'Add New Lead'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Lead Name */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Lead Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Rahul Patel"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. ABC Pvt Ltd"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Phone Number *</label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Alternate Phone */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Alternate Phone</label>
            <input
              type="text"
              name="alternatePhone"
              value={formData.alternatePhone}
              onChange={handleChange}
              placeholder="e.g. Secondary contact"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. rahul@company.com"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Deal Value */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Estimated Lead Value (₹)</label>
            <input
              type="number"
              name="value"
              min="0"
              value={formData.value}
              onChange={handleChange}
              placeholder="0"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Service */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Service Interested</label>
            <select
              name="service"
              value={formData.service}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            >
              <option value="Website Development">Website Development</option>
              <option value="Mobile App Development">Mobile App Development</option>
              <option value="SEO Marketing">SEO Marketing</option>
              <option value="CRM Application">CRM Application</option>
              <option value="E-Commerce Store">E-Commerce Store</option>
              <option value="Digital Branding">Digital Branding</option>
              <option value="General">General Inquiry</option>
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Lead Source</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            >
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Google Business Profile">Google Business Profile</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Lead Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy font-semibold"
            >
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="INTERESTED">INTERESTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="MEETING">MEETING</option>
              <option value="PROPOSAL_SENT">PROPOSAL_SENT</option>
              <option value="NEGOTIATION">NEGOTIATION</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* Assigned User */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Assigned Sales User</label>
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            >
              <option value="">-- Select Team Member --</option>
              {users.map(u => (
                <option key={u._id || u.id} value={u._id || u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Follow up Date */}
          <div>
            <label className="block text-xs font-bold text-crm-text mb-1">Next Follow-Up Date</label>
            <input
              type="date"
              name="nextFollowUp"
              value={formData.nextFollowUp}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-crm-text mb-1">Initial Notes</label>
          <textarea
            rows={3}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Add initial discussion notes or customer requirement summary..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-md shadow-crm-lime/20 disabled:opacity-50 transition-all"
          >
            {submitting ? 'Saving...' : lead ? 'Update Lead' : 'Create Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
