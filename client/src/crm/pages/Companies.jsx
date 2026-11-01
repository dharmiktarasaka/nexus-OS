import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, Globe, Users, DollarSign, Plus } from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { useToast } from '../context/ToastContext';

export const Companies = () => {
  const { showSuccess, showError } = useToast();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyLeads, setCompanyLeads] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    industry: 'General',
    phone: '',
    email: '',
    website: '',
    address: ''
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies');
      if (res.data?.success && Array.isArray(res.data.companies)) {
        setCompanies(res.data.companies);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleOpenCompanyDetail = async (company) => {
    setSelectedCompany(company);
    try {
      const res = await api.get(`/companies/${company._id}`);
      if (res.data?.success) {
        setCompanyLeads(res.data.leads);
      }
    } catch (err) {
      showError('Failed to fetch associated leads');
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!companyForm.name.trim()) return;

    try {
      const res = await api.post('/companies', companyForm);
      if (res.data?.success) {
        showSuccess('Company registered');
        setIsAddModalOpen(false);
        setCompanyForm({ name: '', industry: 'General', phone: '', email: '', website: '', address: '' });
        fetchCompanies();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create company');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-crm-navy">Accounts & Companies</h2>
          <p className="text-xs text-slate-500 mt-0.5">Aggregate leads, deal totals, and contact directory per company</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {loading ? (
        <Loader message="Loading company directory..." />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies registered"
          description="Companies are automatically created when adding leads with company details."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((c) => (
            <div
              key={c._id}
              onClick={() => handleOpenCompanyDetail(c)}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-crm-navy font-black text-lg flex items-center justify-center border border-slate-200">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-crm-navy">{c.name}</h3>
                    <span className="text-[10px] font-semibold text-slate-500">{c.industry}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold block">Associated Leads</span>
                  <span className="text-sm font-extrabold text-crm-navy">{c.leadCount || 0}</span>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800">
                  <span className="text-[10px] font-bold block">Total Deal Value</span>
                  <span className="text-sm font-extrabold">₹{c.totalValue?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Associated Leads Modal */}
      {selectedCompany && (
        <Modal
          isOpen={Boolean(selectedCompany)}
          onClose={() => setSelectedCompany(null)}
          title={`Associated Leads — ${selectedCompany.name}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            {companyLeads.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 text-center">No leads currently assigned to this company.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {companyLeads.map((l) => (
                  <div key={l._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-crm-navy">{l.name}</h4>
                      <p className="text-slate-500 text-[11px]">{l.phone} • {l.service}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 block">₹{l.value?.toLocaleString() || 0}</span>
                      <span className="text-[10px] font-bold text-slate-400">{l.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Company Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register Company">
        <form onSubmit={handleCreateCompany} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={companyForm.name}
              onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
              placeholder="e.g. ABC Pvt Ltd"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Industry</label>
            <input
              type="text"
              value={companyForm.industry}
              onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
              placeholder="e.g. Software & Technology"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime rounded-xl shadow-xs"
            >
              Save Company
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
