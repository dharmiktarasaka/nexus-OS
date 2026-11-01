import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { Building, Calendar, DollarSign, User, Plus } from 'lucide-react';
import api from '../services/api';
import { PriorityBadge } from '../components/Badge';
import { Loader } from '../components/Loader';
import { LostReasonModal } from '../components/LostReasonModal';
import { useToast } from '../context/ToastContext';

const STAGES = [
  { key: 'NEW', label: 'NEW', color: 'border-t-slate-400 bg-slate-50/50' },
  { key: 'CONTACTED', label: 'CONTACTED', color: 'border-t-blue-500 bg-blue-50/30' },
  { key: 'INTERESTED', label: 'INTERESTED', color: 'border-t-cyan-500 bg-cyan-50/30' },
  { key: 'QUALIFIED', label: 'QUALIFIED', color: 'border-t-indigo-500 bg-indigo-50/30' },
  { key: 'MEETING', label: 'MEETING', color: 'border-t-purple-500 bg-purple-50/30' },
  { key: 'PROPOSAL_SENT', label: 'PROPOSAL SENT', color: 'border-t-amber-500 bg-amber-50/30' },
  { key: 'NEGOTIATION', label: 'NEGOTIATION', color: 'border-t-orange-500 bg-orange-50/30' },
  { key: 'WON', label: 'WON', color: 'border-t-emerald-500 bg-emerald-50/30' },
  { key: 'LOST', label: 'LOST', color: 'border-t-rose-500 bg-rose-50/30' }
];

export const Kanban = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshTrigger } = useOutletContext() || {};
  const { showSuccess, showError } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);
  const [pendingLostLead, setPendingLostLead] = useState(null);
  const [targetLostStatus, setTargetLostStatus] = useState(null);

  const fetchKanbanData = async () => {
    setLoading(true);
    try {
      const leadsRes = await api.get('/leads/kanban');
      if (leadsRes.data?.success && Array.isArray(leadsRes.data.leads)) {
        setLeads(leadsRes.data.leads);
      } else {
        setLeads([]);
      }
    } catch (err) {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKanbanData();
  }, [refreshTrigger]);

  const handleDragStart = (e, lead) => {
    setDraggedLead(lead);
    e.dataTransfer.setData('text/plain', lead._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, stageKey) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === stageKey) return;

    if (stageKey === 'LOST') {
      setPendingLostLead(draggedLead);
      setTargetLostStatus(stageKey);
    } else {
      updateLeadStatus(draggedLead._id, stageKey);
    }
    setDraggedLead(null);
  };

  const updateLeadStatus = async (leadId, newStatus, lostReason = '') => {
    try {
      const res = await api.patch(`/leads/${leadId}/status`, { status: newStatus, lostReason });
      if (res.data?.success) {
        showSuccess(`Lead moved to ${newStatus}`);
        fetchKanbanData();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update lead status');
    }
  };

  if (loading) {
    return <Loader message="Loading Kanban Pipeline board..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-crm-navy">Visual Pipeline Kanban</h2>
          <p className="text-xs text-slate-500 mt-0.5">Drag and drop lead cards across stages to update status</p>
        </div>
      </div>

      {/* Columns Container */}
      <div className="flex gap-4 overflow-x-auto pb-6 min-h-[calc(100vh-220px)] items-start">
        {STAGES.map((stage) => {
          const columnLeads = leads.filter(l => l.status === stage.key);
          const totalColumnValue = columnLeads.reduce((acc, curr) => acc + (curr.value || 0), 0);

          return (
            <div
              key={stage.key}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
              className={`w-72 shrink-0 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col max-h-full ${stage.color}`}
            >
              {/* Column Header */}
              <div className={`p-3.5 border-t-4 rounded-t-2xl border-b border-slate-200/60 bg-white flex items-center justify-between`}>
                <div>
                  <h3 className="text-xs font-black text-crm-navy tracking-wide">{stage.label}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    ₹{totalColumnValue.toLocaleString()}
                  </p>
                </div>
                <span className="w-6 h-6 rounded-full bg-slate-100 text-crm-navy font-bold text-xs flex items-center justify-center border border-slate-200">
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1 max-h-[calc(100vh-300px)]">
                {columnLeads.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-slate-200/80 rounded-xl text-center text-slate-400 text-[11px] font-medium">
                    Drag leads here
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <div
                      key={lead._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      onClick={() => navigate(`${basePath}/leads/${lead._id}`)}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-crm-navy group-hover:text-blue-600 transition-colors line-clamp-1">
                          {lead.name}
                        </h4>
                        <PriorityBadge priority={lead.priority} />
                      </div>

                      {lead.companyName && (
                        <p className="flex items-center gap-1 text-[11px] text-slate-500 font-medium truncate">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" />
                          {lead.companyName}
                        </p>
                      )}

                      <p className="text-[11px] text-slate-600 font-semibold truncate bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {lead.service}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="font-extrabold text-emerald-600">
                          ₹{lead.value?.toLocaleString() || 0}
                        </span>

                        {lead.assignedTo?.name && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold" title={`Assigned to ${lead.assignedTo.name}`}>
                            <span className="w-4 h-4 rounded-full bg-crm-navy text-white text-[9px] font-bold flex items-center justify-center">
                              {lead.assignedTo.name.charAt(0)}
                            </span>
                            {lead.assignedTo.name.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lost Reason Modal */}
      <LostReasonModal
        isOpen={Boolean(pendingLostLead)}
        onClose={() => {
          setPendingLostLead(null);
          setTargetLostStatus(null);
        }}
        onSubmit={(reason) => {
          if (pendingLostLead) {
            updateLeadStatus(pendingLostLead._id, 'LOST', reason);
            setPendingLostLead(null);
            setTargetLostStatus(null);
          }
        }}
        leadName={pendingLostLead?.name}
      />
    </div>
  );
};
