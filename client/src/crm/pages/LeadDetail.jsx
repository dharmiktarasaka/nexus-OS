import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Phone,
  MessageSquare,
  Mail,
  Edit,
  ArrowLeft,
  Building,
  Calendar,
  Clock,
  User,
  Plus,
  Send,
  History,
  FileText,
  DollarSign
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { AddEditLeadModal } from '../components/AddEditLeadModal';
import { LostReasonModal } from '../components/LostReasonModal';
import { useToast } from '../context/ToastContext';

export const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Notes state
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);

  // Follow-up form
  const [followUpDate, setFollowUpDate] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [followUpTime, setFollowUpTime] = useState('10:00 AM');
  const [followUpNote, setFollowUpNote] = useState('');

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const [leadRes, actRes] = await Promise.all([
        api.get(`/leads/${id}`),
        api.get(`/leads/${id}/activities`)
      ]);
      if (leadRes.data?.success && leadRes.data?.lead) {
        setLead(leadRes.data.lead);
        setNotFound(false);
      } else {
        setLead(null);
        setNotFound(true);
      }
      if (actRes.data?.success && Array.isArray(actRes.data?.activities)) {
        setActivities(actRes.data.activities);
      } else {
        setActivities([]);
      }
    } catch (err) {
      setLead(null);
      setActivities([]);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await api.post(`/leads/${id}/notes`, { note: newNote });
      if (res.data?.success) {
        showSuccess('Note added to timeline');
        setNewNote('');
        fetchLeadDetails();
      }
    } catch (err) {
      showError('Failed to add note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!followUpDate) {
      showError('Date is required for follow-up');
      return;
    }
    try {
      const res = await api.post('/followups', {
        leadId: id,
        date: followUpDate,
        time: followUpTime,
        note: followUpNote
      });
      if (res.data?.success) {
        showSuccess('Follow-up scheduled');
        setIsFollowUpModalOpen(false);
        setFollowUpNote('');
        fetchLeadDetails();
      }
    } catch (err) {
      showError('Failed to schedule follow-up');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'LOST') {
      setIsLostModalOpen(true);
    } else {
      executeStatusChange(newStatus);
    }
  };

  const executeStatusChange = async (newStatus, lostReason = '') => {
    try {
      const res = await api.patch(`/leads/${id}/status`, { status: newStatus, lostReason });
      if (res.data?.success) {
        showSuccess(`Status changed to ${newStatus}`);
        fetchLeadDetails();
      }
    } catch (err) {
      showError('Failed to update status');
    }
  };

  const handleCallClick = () => {
    window.open(`tel:${lead.phone}`, '_self');
  };

  const handleWhatsAppClick = () => {
    const cleanNum = lead.phone.replace(/[^\d]/g, '');
    window.open(`https://wa.me/${cleanNum}?text=Hello%20${encodeURIComponent(lead.name)},`, '_blank');
  };

  const handleEmailClick = () => {
    if (lead.email) {
      window.open(`mailto:${lead.email}`, '_self');
    }
  };

  if (notFound) {
    return (
      <div className="p-8 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 my-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Lead Not Found</h3>
        <p className="text-sm text-slate-500">This lead does not exist or you do not have permission to view it.</p>
        <button
          onClick={() => navigate(`${basePath}/leads`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  if (loading || !lead) {
    return <Loader message="Loading lead profile..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation */}
      <button
        onClick={() => navigate(`${basePath}/leads`)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-crm-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads Directory
      </button>

      {/* Main Profile Header Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-crm-navy text-crm-lime font-black text-2xl flex items-center justify-center border border-crm-navy-light shrink-0">
            {lead.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-crm-navy">{lead.name}</h2>
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
            </div>

            {lead.companyName && (
              <p className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold mt-1">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {lead.companyName}
              </p>
            )}
          </div>
        </div>

        {/* Quick Contact & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleCallClick}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>Call</span>
          </button>

          <button
            onClick={handleWhatsAppClick}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp</span>
          </button>

          {lead.email && (
            <button
              onClick={handleEmailClick}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all"
            >
              <Mail className="w-4 h-4 text-blue-600" />
              <span>Email</span>
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Follow-up */}
        <div className="space-y-6">
          {/* Contact & Lead Info Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-crm-navy border-b border-slate-100 pb-2">Lead Information</h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Decision Maker / Owner</span>
                <span className="font-bold text-slate-800">{lead.decisionMaker || lead.name}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Industry Sector</span>
                <span className="font-bold text-slate-800">{lead.industry || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Location / City</span>
                <span className="font-bold text-slate-800">{lead.location || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Website URL</span>
                {lead.websiteUrl ? (
                  <a
                    href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline"
                  >
                    {lead.websiteUrl}
                  </a>
                ) : '—'}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Google Review Rating</span>
                <span className="font-bold text-amber-700">{lead.googleReview ? `⭐ ${lead.googleReview}` : '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">EMAILS STATUS</span>
                <span className="font-bold text-blue-600 uppercase">{lead.emailStatus || 'Pending'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Next Action</span>
                <span className="font-bold text-crm-navy bg-slate-100 px-2 py-0.5 rounded-md inline-block">{lead.nextAction || '—'}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Phone Number</span>
                <span className="font-bold text-slate-800">{lead.phone}</span>
                {lead.alternatePhone && <span className="text-slate-500 ml-2">({lead.alternatePhone})</span>}
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Email</span>
                <span className="font-bold text-slate-800">{lead.email || '—'}</span>
              </div>

              {/* Render Any Extra Custom Fields Dynamically */}
              {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-extrabold uppercase text-crm-navy block">Additional Custom Fields:</span>
                  {Object.entries(lead.customFields).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">{k}:</span>
                      <span className="font-bold text-slate-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <span className="text-slate-400 block font-medium">Service Interest</span>
                <span className="font-bold text-crm-navy">{lead.service}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lead Source</span>
                <span className="font-semibold text-slate-700">{lead.source}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Lead Deal Value</span>
                <span className="font-extrabold text-emerald-600 text-sm">₹{lead.value?.toLocaleString() || 0}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Assigned Representative</span>
                <span className="font-semibold text-slate-700">{lead.assignedTo?.name || 'Unassigned'}</span>
              </div>

              {lead.lostReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
                  <span className="text-[11px] font-bold block">Lost Reason:</span>
                  <p className="font-medium text-xs mt-0.5">{lead.lostReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Widget Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-crm-navy">Next Follow-Up</h3>
              <button
                onClick={() => setIsFollowUpModalOpen(true)}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule
              </button>
            </div>

            {lead.nextFollowUp ? (
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>{new Date(lead.nextFollowUp).toLocaleDateString()}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">No upcoming follow-up scheduled.</p>
            )}
          </div>
        </div>

        {/* Right Column: Timeline & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes Input Box */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-crm-navy">Add Activity Note</h3>
            <form onSubmit={handleAddNote} className="space-y-3">
              <textarea
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Log a call summary, client feedback, or proposal update..."
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingNote ? 'Saving...' : 'Post Note'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline Stream */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                Complete Activity History Timeline
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">{activities.length} events logged</span>
            </div>

            <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No activity history recorded yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act._id} className="relative flex items-start gap-4 pl-8">
                    <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-white border-2 border-crm-navy shadow-2xs"></div>
                    <div className="flex-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-crm-navy">{act.description}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(act.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {act.userId?.name && (
                        <p className="text-[10px] text-slate-500 font-semibold">
                          Logged by {act.userId.name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <AddEditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
        onSuccess={fetchLeadDetails}
      />

      {/* Schedule FollowUp Modal */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Schedule Next Follow-Up">
        <form onSubmit={handleScheduleFollowUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Follow-Up Date *</label>
            <input
              type="date"
              required
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Time</label>
            <input
              type="text"
              value={followUpTime}
              onChange={(e) => setFollowUpTime(e.target.value)}
              placeholder="10:00 AM"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Follow-Up Note / Purpose</label>
            <textarea
              rows={3}
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              placeholder="e.g. Call client regarding proposal feedback"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFollowUpModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs"
            >
              Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        onSubmit={(reason) => {
          setIsLostModalOpen(false);
          executeStatusChange('LOST', reason);
        }}
        leadName={lead.name}
      />
    </div>
  );
};
