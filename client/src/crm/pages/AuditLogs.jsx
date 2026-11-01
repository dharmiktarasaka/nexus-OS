import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  User,
  Folder,
  FileSpreadsheet,
  Layers,
  Clock,
  Activity
} from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';
import { Pagination } from '../components/Pagination';
import { useToast } from '../context/ToastContext';

export const AuditLogs = () => {
  const { showError } = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 15 });

  const [search, setSearch] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        search,
        resourceType: resourceTypeFilter
      };

      const res = await api.get('/audit', { params });
      if (res.data?.success) {
        setLogs(res.data.logs || []);
        setPagination({
          page: res.data.currentPage,
          totalPages: res.data.totalPages,
          total: res.data.total,
          limit: pagination.limit
        });
      }
    } catch (err) {
      showError('Failed to load security audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [search, resourceTypeFilter]);

  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-xl border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-crm-lime" />
            Security & Audit Activity Trail
          </h2>
          <p className="text-xs text-slate-300 mt-1">Real-time log of security events, permission changes, exports, and data modifications</p>
        </div>

        <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 text-xs font-bold text-crm-lime shrink-0">
          Total {pagination.total || 0} Security Events
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, email, or action..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
          />
        </div>

        <select
          value={resourceTypeFilter}
          onChange={(e) => setResourceTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold text-crm-navy"
        >
          <option value="">All Resource Types</option>
          <option value="User">User</option>
          <option value="Folder">Folder</option>
          <option value="Dataset">Dataset</option>
          <option value="DynamicRecord">DynamicRecord</option>
          <option value="FolderPermission">FolderPermission</option>
          <option value="Invitation">Invitation</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading audit trail activity..." />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit logs recorded"
            description="No activity matches your selected search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-crm-navy">{log.userName || 'User'}</div>
                      <div className="text-[10px] text-slate-400">{log.userEmail}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-crm-navy border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-semibold">
                      {log.resourceType}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              limit={pagination.limit}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};
