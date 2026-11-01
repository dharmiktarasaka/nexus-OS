import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Plus,
  Download,
  Trash2,
  Search,
  FileSpreadsheet,
  Layers,
  RefreshCw,
  Share2,
  Folder as FolderIcon,
  Smartphone
} from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { DynamicTable } from '../components/DynamicTable';
import { ExcelImportModal } from '../components/ExcelImportModal';
import { AddEditRecordModal } from '../components/AddEditRecordModal';
import { ShareFolderModal } from '../components/ShareFolderModal';
import { SendEmailModal } from '../components/SendEmailModal';
import { SendWhatsAppModal } from '../components/SendWhatsAppModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const FolderDetail = () => {
  const { id: folderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [folder, setFolder] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState('all');

  // Dynamic Records State
  const [records, setRecords] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, limit: 10 });

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({});

  // Selection & Modals state
  const [selectedRecordIds, setSelectedRecordIds] = useState([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddEditRecordOpen, setIsAddEditRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isSendWhatsAppModalOpen, setIsSendWhatsAppModalOpen] = useState(false);

  const [notFound, setNotFound] = useState(false);

  // Fetch Folder Header Details
  const fetchFolderInfo = async () => {
    try {
      const res = await api.get(`/folders/${folderId}`);
      if (res.data?.success && res.data?.folder) {
        setFolder(res.data.folder);
        setDatasets(res.data.datasets || []);
        setNotFound(false);
      } else {
        setNotFound(true);
        setFolder(null);
      }
    } catch (err) {
      setNotFound(true);
      setFolder(null);
    }
  };

  // Fetch Records
  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        datasetId: activeDatasetId,
        search,
        sortBy,
        sortOrder,
        columnFilters: JSON.stringify(columnFilters)
      };

      const res = await api.get(`/folders/${folderId}/records`, { params });
      if (res.data?.success && Array.isArray(res.data?.records)) {
        setRecords(res.data.records);
        setHeaders(res.data.headers || []);
        setPagination({
          page: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total ?? res.data.records.length,
          limit: pagination.limit
        });
      } else {
        setRecords([]);
        setHeaders([]);
      }
    } catch (err) {
      setRecords([]);
      setHeaders([]);
    } finally {
      setLoading(false);
    }
  }, [folderId, activeDatasetId, search, sortBy, sortOrder, columnFilters, pagination.limit]);

  useEffect(() => {
    fetchFolderInfo();
  }, [folderId]);

  useEffect(() => {
    fetchRecords(1);
    setSelectedRecordIds([]);
  }, [activeDatasetId, search, sortBy, sortOrder, columnFilters]);

  const handlePageChange = (newPage) => {
    fetchRecords(newPage);
  };

  const handleSortChange = (key) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleColumnFilterChange = (key, val) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: val
    }));
  };

  const handleSelectRow = (recordId) => {
    setSelectedRecordIds(prev =>
      prev.includes(recordId) ? prev.filter(i => i !== recordId) : [...prev, recordId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRecordIds(records.map(r => r._id));
    } else {
      setSelectedRecordIds([]);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await api.delete(`/folders/records/${recordId}`);
      if (res.data?.success) {
        showSuccess('Record deleted successfully');
        fetchRecords(pagination.page);
        fetchFolderInfo();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedRecordIds.length} selected records?`)) return;

    try {
      const res = await api.post(`/folders/${folderId}/bulk-delete`, { recordIds: selectedRecordIds });
      if (res.data?.success) {
        showSuccess(res.data.message || 'Records deleted successfully');
        setSelectedRecordIds([]);
        fetchRecords(pagination.page);
        fetchFolderInfo();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Bulk delete failed');
    }
  };

  const handleExport = async (format = 'xlsx') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (activeDatasetId !== 'all') params.append('datasetId', activeDatasetId);
      if (selectedRecordIds.length > 0) params.append('recordIds', selectedRecordIds.join(','));
      if (search) params.append('search', search);

      const response = await api.get(`/folders/${folderId}/export?${params.toString()}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${folder?.name ? folder.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'dataset'}_export.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to export folder records');
    }
  };

  if (notFound) {
    return (
      <div className="p-8 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 my-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Folder Not Found</h3>
        <p className="text-sm text-slate-500">This folder does not exist or you do not have permission to access it.</p>
        <button
          onClick={() => navigate(`${basePath}/folders`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
        >
          Back to Folders
        </button>
      </div>
    );
  }

  if (!folder) {
    return <Loader message="Loading folder dataset records..." />;
  }

  const isVisitor = currentUser?.role === 'VISITOR';
  const isCreator = Boolean(folder.isOwner);
  const canEdit = !isVisitor && (isCreator || ['EDIT', 'FULL_ACCESS'].includes(folder.accessLevel));
  const canDelete = !isVisitor && isCreator;
  const canShare = !isVisitor && (isCreator || folder.accessLevel === 'FULL_ACCESS');
  const canExport = isCreator || ['VIEW_EXPORT', 'EDIT', 'FULL_ACCESS'].includes(folder.accessLevel) || (currentUser?.permissions?.records?.export !== false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button & Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-xl border border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`${basePath}/folders`)}
            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color || '#4F46E5' }} />
              <h2 className="text-xl font-extrabold tracking-tight">{folder.name}</h2>
              <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                (folder.category || 'INDIA').toUpperCase() === 'INTERNATIONAL'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
              }`}>
                {(folder.category || 'INDIA').toUpperCase() === 'INTERNATIONAL' ? '🌐 International' : '🇮🇳 India'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {folder.description || 'Dynamic Excel Dataset Management'} • {folder.totalRecords?.toLocaleString() || 0} Total Records
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-crm-lime text-crm-navy font-extrabold text-xs rounded-xl shadow-md hover:bg-crm-lime-hover transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Excel
            </button>
          )}

          <button
            onClick={() => setIsSendWhatsAppModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-md hover:bg-emerald-400 transition-all"
          >
            <Smartphone className="w-4 h-4" />
            Send WhatsApp
          </button>

          {canEdit && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setIsAddEditRecordOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/20 transition-all border border-white/10"
            >
              <Plus className="w-4 h-4" />
              Add Record
            </button>
          )}

          {canShare && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl shadow-md hover:bg-emerald-500 transition-all"
            >
              <Share2 className="w-4 h-4" />
              Share Folder
            </button>
          )}

          {canExport && (
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-bold text-xs rounded-xl hover:bg-white/20 transition-all border border-white/10"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}

          {canDelete && selectedRecordIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600/90 text-white font-extrabold text-xs rounded-xl hover:bg-rose-600 transition-all shadow-md"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedRecordIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Datasets Switcher Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-crm-navy flex items-center gap-1.5 px-3 py-1.5 shrink-0 bg-slate-100 rounded-xl">
          <FileSpreadsheet className="w-4 h-4 text-crm-lime" />
          Datasets:
        </span>

        {/* All Records Tab */}
        <button
          onClick={() => setActiveDatasetId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 ${
            activeDatasetId === 'all'
              ? 'bg-crm-navy text-white shadow-md shadow-crm-navy/20'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Folder Records
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-current font-bold">
            {folder.totalRecords || 0}
          </span>
        </button>

        {/* Individual Excel File Tabs */}
        {datasets.map((ds) => (
          <button
            key={ds._id}
            onClick={() => setActiveDatasetId(ds._id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              activeDatasetId === ds._id
                ? 'bg-crm-lime text-crm-navy shadow-md shadow-crm-lime/20 font-black'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
            }`}
          >
            <span>{ds.fileName}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-crm-navy font-bold">
              {ds.recordCount || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Global Search Bar Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search across all fields..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
          />
        </div>

        <button
          onClick={() => fetchRecords(pagination.page)}
          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Dynamic Data Table Component */}
      <DynamicTable
        headers={headers}
        records={records}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        selectedRecordIds={selectedRecordIds}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        onEditRecord={canEdit ? (rec) => {
          setEditingRecord(rec);
          setIsAddEditRecordOpen(true);
        } : null}
        onDeleteRecord={canDelete ? handleDeleteRecord : null}
        onAddRecordClick={canEdit ? () => {
          setEditingRecord(null);
          setIsAddEditRecordOpen(true);
        } : null}
        onSendEmailClick={() => setIsSendEmailModalOpen(true)}
        onSendWhatsAppClick={() => setIsSendWhatsAppModalOpen(true)}
      />

      {/* Excel Import Modal */}
      {canEdit && (
        <ExcelImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          folderId={folderId}
          folderName={folder.name}
          onSuccess={(imported) => {
            if (imported?.dataset && Array.isArray(imported?.records) && imported.records.length > 0) {
              setDatasets(prev => [imported.dataset, ...prev.filter(d => d._id !== imported.dataset._id)]);
              setActiveDatasetId(imported.dataset._id);
              setRecords(imported.records);
              if (imported.headers && imported.headers.length > 0) {
                setHeaders(imported.headers);
              }
              setFolder(prev => prev ? {
                ...prev,
                datasetCount: (prev.datasetCount || 0) + 1,
                totalRecords: (prev.totalRecords || 0) + imported.records.length
              } : prev);
              setPagination({
                page: 1,
                totalPages: Math.max(1, Math.ceil(imported.records.length / 10)),
                total: imported.records.length,
                limit: 10
              });
            } else {
              fetchFolderInfo();
              fetchRecords(1);
            }
          }}
        />
      )}

      {/* Add / Edit Record Modal */}
      {canEdit && (
        <AddEditRecordModal
          isOpen={isAddEditRecordOpen}
          onClose={() => {
            setIsAddEditRecordOpen(false);
            setEditingRecord(null);
          }}
          datasetId={activeDatasetId !== 'all' ? activeDatasetId : datasets[0]?._id}
          datasets={datasets}
          headers={headers && headers.length > 0 ? headers : (datasets.find(d => d._id === activeDatasetId)?.headers || datasets[0]?.headers || [])}
          record={editingRecord}
          onOpenImport={() => {
            setIsAddEditRecordOpen(false);
            setIsImportModalOpen(true);
          }}
          onSuccess={() => {
            fetchRecords(pagination.page);
            fetchFolderInfo();
          }}
        />
      )}

      {/* Share Folder Modal */}
      {canShare && (
        <ShareFolderModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          folderId={folderId}
          folderName={folder.name}
          onSuccess={fetchFolderInfo}
        />
      )}

      {/* SMTP Send Email Modal */}
      <SendEmailModal
        isOpen={isSendEmailModalOpen}
        onClose={() => setIsSendEmailModalOpen(false)}
        folderId={folderId}
        headers={headers}
        selectedRecordIds={selectedRecordIds}
        activeDatasetId={activeDatasetId}
        search={search}
        columnFilters={columnFilters}
      />

      {/* Bulk WhatsApp Message Modal */}
      <SendWhatsAppModal
        isOpen={isSendWhatsAppModalOpen}
        onClose={() => setIsSendWhatsAppModalOpen(false)}
        folderId={folderId}
        folderName={folder.name}
        headers={headers}
        selectedRecordIds={selectedRecordIds}
        activeDatasetId={activeDatasetId}
        search={search}
        columnFilters={columnFilters}
      />
    </div>
  );
};
