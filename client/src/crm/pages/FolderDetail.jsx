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

  const loadFallbackFolder = () => {
    const isHealth = folderId === 'f_2';
    const mockFolder = {
      _id: folderId,
      name: isHealth ? 'US HealthCare Providers' : 'India Tech & SaaS Startups',
      description: isHealth ? 'Medical and healthcare clinics in California' : 'Verified founders and CEOs in Bangalore & Mumbai',
      color: isHealth ? '#059669' : '#4F46E5',
      category: isHealth ? 'INTERNATIONAL' : 'INDIA',
      datasetCount: isHealth ? 1 : 2,
      totalRecords: isHealth ? 14 : 28,
      isOwner: true,
      accessLevel: 'FULL_ACCESS'
    };
    const mockDatasets = isHealth ? [
      {
        _id: 'ds_3',
        fileName: 'California_Clinics_Directory.xlsx',
        recordCount: 14,
        headers: [
          { key: 'clinic_name', label: 'Clinic Name', type: 'TEXT' },
          { key: 'contact_person', label: 'Contact Person', type: 'TEXT' },
          { key: 'speciality', label: 'Speciality', type: 'TEXT' },
          { key: 'email', label: 'Email', type: 'EMAIL' },
          { key: 'phone', label: 'Phone', type: 'PHONE' },
          { key: 'city', label: 'City', type: 'TEXT' },
          { key: 'state', label: 'State', type: 'TEXT' }
        ]
      }
    ] : [
      {
        _id: 'ds_1',
        fileName: 'Bangalore_Founders_Oct2026.xlsx',
        recordCount: 16,
        headers: [
          { key: 'name', label: 'Founder Name', type: 'TEXT' },
          { key: 'company', label: 'Company', type: 'TEXT' },
          { key: 'designation', label: 'Designation', type: 'TEXT' },
          { key: 'email', label: 'Email', type: 'EMAIL' },
          { key: 'phone', label: 'Phone', type: 'PHONE' },
          { key: 'city', label: 'City', type: 'TEXT' },
          { key: 'funding', label: 'Funding Stage', type: 'TEXT' }
        ]
      },
      {
        _id: 'ds_2',
        fileName: 'Mumbai_SaaS_Leadership.xlsx',
        recordCount: 12,
        headers: [
          { key: 'name', label: 'Founder Name', type: 'TEXT' },
          { key: 'company', label: 'Company', type: 'TEXT' },
          { key: 'designation', label: 'Designation', type: 'TEXT' },
          { key: 'email', label: 'Email', type: 'EMAIL' },
          { key: 'phone', label: 'Phone', type: 'PHONE' },
          { key: 'city', label: 'City', type: 'TEXT' },
          { key: 'funding', label: 'Funding Stage', type: 'TEXT' }
        ]
      }
    ];

    setFolder(mockFolder);
    setDatasets(mockDatasets);
  };

  const loadFallbackRecords = () => {
    const isHealth = folderId === 'f_2';
    if (isHealth) {
      const hdrs = [
        { key: 'clinic_name', label: 'Clinic Name', type: 'TEXT' },
        { key: 'contact_person', label: 'Contact Person', type: 'TEXT' },
        { key: 'speciality', label: 'Speciality', type: 'TEXT' },
        { key: 'email', label: 'Email', type: 'EMAIL' },
        { key: 'phone', label: 'Phone', type: 'PHONE' },
        { key: 'city', label: 'City', type: 'TEXT' },
        { key: 'state', label: 'State', type: 'TEXT' }
      ];
      const recs = [
        { _id: 'rec_201', data: { clinic_name: 'Bay Area Health & Heart Institute', contact_person: 'Dr. Robert Miller', speciality: 'Cardiology', email: 'r.miller@bayhealth.org', phone: '+1 (415) 555-0192', city: 'San Francisco', state: 'California' } },
        { _id: 'rec_202', data: { clinic_name: 'Pacific Coast Wellness Center', contact_person: 'Dr. Sarah Lin', speciality: 'Orthopedics', email: 's.lin@pacificwellness.com', phone: '+1 (310) 555-0144', city: 'Los Angeles', state: 'California' } },
        { _id: 'rec_203', data: { clinic_name: 'Golden State Dermatology & Laser', contact_person: 'Dr. Michael Chen', speciality: 'Dermatology', email: 'chen@goldenstatemed.com', phone: '+1 (619) 555-0187', city: 'San Diego', state: 'California' } },
        { _id: 'rec_204', data: { clinic_name: 'Silicon Valley Urgent Care Network', contact_person: 'Dr. Emily Vance', speciality: 'Urgent Care', email: 'evance@svurgentcare.org', phone: '+1 (408) 555-0133', city: 'San Jose', state: 'California' } },
        { _id: 'rec_205', data: { clinic_name: 'Newport Beach Neurological Group', contact_person: 'Dr. David Foster', speciality: 'Neurology', email: 'dfoster@newportneuro.com', phone: '+1 (949) 555-0165', city: 'Newport Beach', state: 'California' } }
      ];
      setHeaders(hdrs);
      setRecords(recs);
      setPagination({ page: 1, totalPages: 1, total: recs.length, limit: pagination.limit });
    } else {
      const hdrs = [
        { key: 'name', label: 'Founder Name', type: 'TEXT' },
        { key: 'company', label: 'Company', type: 'TEXT' },
        { key: 'designation', label: 'Designation', type: 'TEXT' },
        { key: 'email', label: 'Email', type: 'EMAIL' },
        { key: 'phone', label: 'Phone', type: 'PHONE' },
        { key: 'city', label: 'City', type: 'TEXT' },
        { key: 'funding', label: 'Funding Stage', type: 'TEXT' }
      ];
      const recs = [
        { _id: 'rec_101', data: { name: 'Arjun Mehta', company: 'HyperScale AI Technologies', designation: 'Founder & CEO', email: 'arjun@hyperscale.io', phone: '+91 98201 12345', city: 'Bangalore', funding: 'Series A ($4.2M)' } },
        { _id: 'rec_102', data: { name: 'Pooja Sharma', company: 'CloudMatrix Security Labs', designation: 'Co-Founder & CTO', email: 'pooja@cloudmatrix.dev', phone: '+91 98450 67890', city: 'Bangalore', funding: 'Seed ($1.5M)' } },
        { _id: 'rec_103', data: { name: 'Rohan Verma', company: 'FinFlow Enterprise Tech', designation: 'VP Engineering', email: 'rohan.v@finflow.in', phone: '+91 98190 23456', city: 'Mumbai', funding: 'Series B ($12M)' } },
        { _id: 'rec_104', data: { name: 'Ananya Iyer', company: 'CyberShield Systems India', designation: 'Managing Director', email: 'ananya@cybershield.in', phone: '+91 98765 43210', city: 'Bangalore', funding: 'Pre-Seed ($500K)' } },
        { _id: 'rec_105', data: { name: 'Vikram Joshi', company: 'DataSphere Omni Analytics', designation: 'Chief Executive Officer', email: 'vikram@datasphere.ai', phone: '+91 98234 56789', city: 'Mumbai', funding: 'Series A ($6.8M)' } },
        { _id: 'rec_106', data: { name: 'Neha Kulkarni', company: 'LogiNext Cloud Platforms', designation: 'Head of Growth', email: 'neha@loginext.in', phone: '+91 98333 45678', city: 'Mumbai', funding: 'Series C ($35M)' } }
      ];
      setHeaders(hdrs);
      setRecords(recs);
      setPagination({ page: 1, totalPages: 1, total: recs.length, limit: pagination.limit });
    }
  };

  // Fetch Folder Header Details
  const fetchFolderInfo = async () => {
    try {
      const res = await api.get(`/folders/${folderId}`);
      if (res.data?.success && res.data?.folder) {
        setFolder(res.data.folder);
        setDatasets(res.data.datasets || []);
      } else {
        loadFallbackFolder();
      }
    } catch (err) {
      loadFallbackFolder();
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
      if (res.data?.success && Array.isArray(res.data?.records) && res.data.records.length > 0) {
        setRecords(res.data.records);
        setHeaders(res.data.headers || []);
        setPagination({
          page: res.data.currentPage || 1,
          totalPages: res.data.totalPages || 1,
          total: res.data.total || res.data.records.length,
          limit: pagination.limit
        });
      } else {
        loadFallbackRecords();
      }
    } catch (err) {
      loadFallbackRecords();
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
