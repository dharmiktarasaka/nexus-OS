import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, AlertTriangle, Building, Phone, ArrowUpRight } from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Followups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshTrigger } = useOutletContext() || {};
  const { showSuccess, showError } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [activeTab, setActiveTab] = useState('today'); // today, overdue, upcoming, completed
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/followups?filter=${activeTab}`);
      if (res.data?.success && Array.isArray(res.data.followUps)) {
        setFollowUps(res.data.followUps);
      } else {
        setFollowUps([]);
      }
    } catch (err) {
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [activeTab, refreshTrigger]);

  const handleComplete = async (id) => {
    try {
      const res = await api.patch(`/followups/${id}/complete`);
      if (res.data?.success) {
        showSuccess('Follow-up completed');
        fetchFollowUps();
      }
    } catch (err) {
      showError('Failed to update follow-up');
    }
  };

  const tabs = [
    { key: 'today', label: "Today's Follow-ups" },
    { key: 'overdue', label: 'Overdue Follow-ups' },
    { key: 'upcoming', label: 'Upcoming Follow-ups' },
    { key: 'completed', label: 'Completed Log' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-crm-navy">Follow-up Management</h2>
        <p className="text-xs text-slate-500 mt-0.5">Track scheduled customer calls, meetings, and reminder tasks</p>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-1 border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-crm-lime text-crm-navy font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Stream */}
      {loading ? (
        <Loader message="Fetching follow-ups..." />
      ) : followUps.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No ${activeTab} follow-ups`}
          description="You are completely up to date for this section."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followUps.map((f) => (
            <div
              key={f._id}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      onClick={() => navigate(`${basePath}/leads/${f.leadId?._id}`)}
                      className="text-sm font-bold text-crm-navy hover:text-blue-600 cursor-pointer"
                    >
                      {f.leadId?.name || 'Lead Record'}
                    </h3>
                    {f.leadId?.companyName && (
                      <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {f.leadId.companyName}
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                    {f.time}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{new Date(f.date).toLocaleDateString()}</span>
                </div>

                {f.note && (
                  <p className="text-xs text-slate-600 font-medium italic bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    "{f.note}"
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`${basePath}/leads/${f.leadId?._id}`)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-crm-navy"
                >
                  Open Profile
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>

                {f.status === 'PENDING' && (
                  <button
                    onClick={() => handleComplete(f._id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
