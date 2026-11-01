import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Building, Phone } from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Trash = () => {
  const { showSuccess, showError } = useToast();
  const [deletedLeads, setDeletedLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrashLeads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leads?isDeleted=true');
      if (res.data?.success) {
        setDeletedLeads(res.data.leads);
      }
    } catch (err) {
      showError('Failed to fetch trash leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashLeads();
  }, []);

  const handleRestore = async (id) => {
    try {
      const res = await api.patch(`/leads/${id}/restore`);
      if (res.data?.success) {
        showSuccess('Lead restored successfully');
        fetchTrashLeads();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to restore lead (Admin authorization required)');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-extrabold text-crm-navy">Soft Delete Trash</h2>
        <p className="text-xs text-slate-500 mt-0.5">Recover deleted lead records or view audit details</p>
      </div>

      {loading ? (
        <Loader message="Loading trash records..." />
      ) : deletedLeads.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="There are no deleted lead records in the bin."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Lead Name</th>
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {deletedLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{lead.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{lead.companyName || '—'}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{lead.phone}</td>
                    <td className="py-3.5 px-4 text-slate-600">{lead.service}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleRestore(lead._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Restore Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
