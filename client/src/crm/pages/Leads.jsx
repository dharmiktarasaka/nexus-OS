import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  Phone,
  Mail,
  Calendar,
  Building
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, PriorityBadge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { LostReasonModal } from '../components/LostReasonModal';
import { AddEditLeadModal } from '../components/AddEditLeadModal';
import { useToast } from '../context/ToastContext';

export const Leads = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshTrigger, onLeadCreated } = useOutletContext() || {};
  const { showSuccess, showError } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [users, setUsers] = useState([]);

  // Filters State
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [sourceFilter, setSourceFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [followUpDateFilter, setFollowUpDateFilter] = useState('');

  // Modals state
  const [editingLead, setEditingLead] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [pendingLostLead, setPendingLostLead] = useState(null);

  useEffect(() => {
    // Fetch users for filters
    api.get('/users')
      .then((uRes) => {
        if (uRes.data?.users) setUsers(uRes.data.users);
      })
      .catch(() => {});
  }, []);

  const fetchLeads = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        source: sourceFilter,
        service: serviceFilter,
        priority: priorityFilter,
        assignedTo: assignedFilter,
        followUpDate: followUpDateFilter
      };

      const res = await api.get('/leads', { params });
      if (res.data?.success && Array.isArray(res.data?.leads)) {
        setLeads(res.data.leads);
        setPagination({
          page: res.data.currentPage || 1,
          limit: pagination.limit,
          total: res.data.total || res.data.leads.length,
          totalPages: res.data.totalPages || 1
        });
      } else {
        setLeads([]);
        setPagination({ page: 1, limit: pagination.limit, total: 0, totalPages: 1 });
      }
    } catch (err) {
      setLeads([]);
      setPagination({ page: 1, limit: pagination.limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(1);
  }, [
    search,
    statusFilter,
    sourceFilter,
    serviceFilter,
    priorityFilter,
    assignedFilter,
    followUpDateFilter,
    refreshTrigger
  ]);

  const duplicateNameCounts = useMemo(() => {
    const map = new Map();
    leads.forEach(l => {
      const nameKey = (l.name || '').trim().toLowerCase();
      const compKey = (l.companyName || '').trim().toLowerCase();
      if (nameKey) map.set(nameKey, (map.get(nameKey) || 0) + 1);
      if (compKey) map.set(compKey, (map.get(compKey) || 0) + 1);
    });
    return map;
  }, [leads]);

  const handleStatusChangeClick = (lead, newStatus) => {
    if (newStatus === 'LOST') {
      setPendingLostLead(lead);
    } else {
      executeStatusUpdate(lead._id, newStatus);
    }
  };

  const executeStatusUpdate = async (leadId, newStatus, lostReason = '') => {
    try {
      const res = await api.patch(`/leads/${leadId}/status`, { status: newStatus, lostReason });
      if (res.data?.success) {
        showSuccess(`Status changed to ${newStatus}`);
        fetchLeads(pagination.page);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  const handleLostReasonSubmit = (reason) => {
    if (pendingLostLead) {
      executeStatusUpdate(pendingLostLead._id, 'LOST', reason);
      setPendingLostLead(null);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to move this lead to Trash?')) return;
    try {
      const res = await api.delete(`/leads/${leadId}`);
      if (res.data?.success) {
        showSuccess('Lead moved to Trash');
        fetchLeads(pagination.page);
      }
    } catch (err) {
      showError('Failed to delete lead');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setServiceFilter('');
    setPriorityFilter('');
    setAssignedFilter('');
    setFollowUpDateFilter('');
    setSearchParams({});
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter & Search Bar Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, company..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20"
          >
            <option value="">All Statuses</option>
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

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20"
          >
            <option value="">All Services</option>
            <option value="Website Development">Website Development</option>
            <option value="Mobile App Development">Mobile App Development</option>
            <option value="SEO Marketing">SEO Marketing</option>
            <option value="CRM Application">CRM Application</option>
            <option value="E-Commerce Store">E-Commerce Store</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20"
          >
            <option value="">All Sources</option>
            <option value="Google Ads">Google Ads</option>
            <option value="Meta Ads">Meta Ads</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Google Business Profile">Google Business Profile</option>
            <option value="Cold Call">Cold Call</option>
          </select>
        </div>

        {/* Extended Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            >
              <option value="">All Priorities</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="URGENT">URGENT</option>
            </select>

            {/* Assigned User Filter */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            >
              <option value="">All Assigned Users</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>

            {/* Follow-up Date Filter */}
            <input
              type="date"
              value={followUpDateFilter}
              onChange={(e) => setFollowUpDateFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
            />
          </div>

          {(search || statusFilter || sourceFilter || serviceFilter || priorityFilter || assignedFilter || followUpDateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setSourceFilter('');
                setServiceFilter('');
                setPriorityFilter('');
                setAssignedFilter('');
                setFollowUpDateFilter('');
                setSearchParams({});
              }}
              className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700"
            >
              <X className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Leads Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading leads list..." />
        ) : leads.length === 0 ? (
          <EmptyState
            title="No leads found"
            description="No lead records match your search or selected filter rules."
            actionButton={
              <button
                onClick={() => {
                  setEditingLead(null);
                  setIsEditModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime rounded-xl shadow-xs hover:bg-crm-lime-hover"
              >
                <Plus className="w-4 h-4" />
                Add New Lead
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Lead Name & Company</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Service & Source</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Assigned To</th>
                  <th className="py-3.5 px-4">Next Follow-up</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Name & Company */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const nameKey = (lead.name || '').trim().toLowerCase();
                        const compKey = (lead.companyName || '').trim().toLowerCase();
                        const isNameDup = nameKey && (duplicateNameCounts.get(nameKey) || 0) > 1;
                        const isCompDup = compKey && (duplicateNameCounts.get(compKey) || 0) > 1;

                        return (
                          <div>
                            <div
                              onClick={() => navigate(`${basePath}/leads/${lead._id}`)}
                              className={`font-bold cursor-pointer text-sm transition-all ${
                                isNameDup
                                  ? 'bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md border border-amber-400/90 inline-flex items-center gap-1.5 font-extrabold shadow-2xs'
                                  : 'text-crm-navy hover:text-blue-600'
                              }`}
                            >
                              <span>{lead.name}</span>
                              {isNameDup && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-amber-400 text-amber-950 border border-amber-500/60 shadow-2xs">
                                  Name Match
                                </span>
                              )}
                            </div>
                            {lead.companyName && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                                <Building className="w-3 h-3 text-slate-400 shrink-0" />
                                <span
                                  className={
                                    isCompDup
                                      ? 'bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md border border-amber-400/90 font-extrabold inline-flex items-center gap-1 shadow-2xs'
                                      : ''
                                  }
                                >
                                  <span>{lead.companyName}</span>
                                  {isCompDup && !isNameDup && (
                                    <span className="px-1 py-0.2 text-[8px] font-black uppercase rounded bg-amber-400 text-amber-950 border border-amber-500/50">
                                      Match
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Phone & Email */}
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          {lead.email}
                        </div>
                      )}
                    </td>

                    {/* Service & Source */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{lead.service}</div>
                      <div className="text-[11px] text-slate-400">{lead.source}</div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChangeClick(lead, e.target.value)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-crm-navy/20 cursor-pointer shadow-2xs"
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
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={lead.priority} />
                    </td>

                    {/* Assigned To */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {lead.assignedTo?.name ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-crm-navy text-white text-[10px] font-bold flex items-center justify-center">
                            {lead.assignedTo.name.charAt(0)}
                          </span>
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-4">
                      {lead.nextFollowUp ? (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                          <Calendar className="w-3 h-3 shrink-0" />
                          {new Date(lead.nextFollowUp).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`${basePath}/leads/${lead._id}`)}
                          title="View Profile & History"
                          className="p-1.5 text-slate-400 hover:text-crm-navy hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsEditModalOpen(true);
                          }}
                          title="Edit Lead"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          title="Move to Trash"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={(page) => fetchLeads(page)}
        />
      </div>

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={Boolean(pendingLostLead)}
        onClose={() => setPendingLostLead(null)}
        onSubmit={handleLostReasonSubmit}
        leadName={pendingLostLead?.name}
      />

      {/* Add / Edit Modal */}
      <AddEditLeadModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        onSuccess={() => fetchLeads(pagination.page)}
      />
    </div>
  );
};
