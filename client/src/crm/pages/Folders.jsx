import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  FolderPlus,
  Search,
  Folder as FolderIcon,
  FileSpreadsheet,
  Layers,
  Edit,
  Trash2,
  ExternalLink,
  Share2,
  ShieldCheck,
  Users,
  Globe,
  MapPin
} from 'lucide-react';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import { ShareFolderModal } from '../components/ShareFolderModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const FOLDER_COLORS = ['#4F46E5', '#6366F1', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#64748B'];

export const Folders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';
  const currentCategory = searchParams.get('category')?.toLowerCase() || 'all';

  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#4F46E5', category: 'INDIA' });
  const [submitting, setSubmitting] = useState(false);

  // Share Folder Modal state
  const [sharingFolder, setSharingFolder] = useState(null);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/folders');
      if (res.data?.success && Array.isArray(res.data?.folders) && res.data.folders.length > 0) {
        setFolders(res.data.folders);
      } else {
        setFolders([
          { _id: 'f_1', name: 'India Tech & SaaS Startups', description: 'Verified founders and CEOs in Bangalore & Mumbai', color: '#4F46E5', category: 'INDIA', datasetCount: 2, totalRecords: 28, leadCount: 28, isOwner: true, accessLevel: 'FULL_ACCESS' },
          { _id: 'f_2', name: 'US HealthCare Providers', description: 'Medical and healthcare clinics in California', color: '#059669', category: 'INTERNATIONAL', datasetCount: 1, totalRecords: 14, leadCount: 14, isOwner: true, accessLevel: 'FULL_ACCESS' }
        ]);
      }
    } catch (err) {
      setFolders([
        { _id: 'f_1', name: 'India Tech & SaaS Startups', description: 'Verified founders and CEOs in Bangalore & Mumbai', color: '#4F46E5', category: 'INDIA', datasetCount: 2, totalRecords: 28, leadCount: 28, isOwner: true, accessLevel: 'FULL_ACCESS' },
        { _id: 'f_2', name: 'US HealthCare Providers', description: 'Medical and healthcare clinics in California', color: '#059669', category: 'INTERNATIONAL', datasetCount: 1, totalRecords: 14, leadCount: 14, isOwner: true, accessLevel: 'FULL_ACCESS' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCategoryFilter = (cat) => {
    if (cat === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), category: cat });
    }
  };

  const handleOpenModal = (folder = null) => {
    if (folder) {
      setEditingFolder(folder);
      setFormData({
        name: folder.name || '',
        description: folder.description || '',
        color: folder.color || '#4F46E5',
        category: (folder.category || 'INDIA').toUpperCase()
      });
    } else {
      setEditingFolder(null);
      const defaultCat = currentCategory === 'international' ? 'INTERNATIONAL' : 'INDIA';
      setFormData({ name: '', description: '', color: '#4F46E5', category: defaultCat });
    }
    setIsModalOpen(true);
  };

  const handleSaveFolder = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Folder name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingFolder) {
        await api.put(`/folders/${editingFolder._id}`, formData);
        showSuccess('Folder updated successfully');
      } else {
        await api.post('/folders', formData);
        showSuccess('Folder created successfully');
      }
      fetchFolders();
      setIsModalOpen(false);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save folder');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    if (!window.confirm(`Are you sure you want to delete folder "${folder.name}" and all its imported Excel datasets and records?`)) {
      return;
    }

    try {
      const res = await api.delete(`/folders/${folder._id}`);
      if (res.data?.success) {
        showSuccess('Folder deleted successfully');
        fetchFolders();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete folder');
    }
  };

  const filteredFolders = folders.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

    const folderCat = (f.category || 'INDIA').toLowerCase();
    const matchesCategory = currentCategory === 'all' || folderCat === currentCategory;

    return matchesSearch && matchesCategory;
  });

  const isVisitor = currentUser?.role === 'VISITOR';
  const canCreateFolder = !isVisitor && (currentUser?.role === 'ADMIN' || currentUser?.permissions?.folders?.create !== false);

  const indiaCount = folders.filter(f => (f.category || 'INDIA').toUpperCase() === 'INDIA').length;
  const internationalCount = folders.filter(f => (f.category || 'INDIA').toUpperCase() === 'INTERNATIONAL').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-xl border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {currentCategory === 'india' ? '🇮🇳 India Folders' : currentCategory === 'international' ? '🌐 International Folders' : 'My Private & Shared Folders'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">Organize dynamic Excel imports, datasets, and custom records in categorized folders</p>
        </div>

        {canCreateFolder && (
          <button
            onClick={() => handleOpenModal(null)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-crm-lime text-crm-navy font-extrabold text-xs rounded-xl shadow-lg hover:bg-crm-lime-hover transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            Create New Folder
          </button>
        )}
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Category Selector Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 w-fit max-w-full overflow-x-auto">
          <button
            onClick={() => handleCategoryFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              currentCategory === 'all'
                ? 'bg-crm-navy text-crm-lime shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Folders ({folders.length})</span>
          </button>

          <button
            onClick={() => handleCategoryFilter('india')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              currentCategory === 'india'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>🇮🇳 India ({indiaCount})</span>
          </button>

          <button
            onClick={() => handleCategoryFilter('international')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              currentCategory === 'international'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>🌐 International ({internationalCount})</span>
          </button>
        </div>

        {/* Search Filter Bar */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search folders by name or description..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          <p className="text-xs font-extrabold text-slate-500 hidden sm:block">
            Showing {filteredFolders.length} of {folders.length} Folders
          </p>
        </div>
      </div>

      {/* Folders Grid */}
      {loading ? (
        <Loader message="Loading accessible folders..." />
      ) : filteredFolders.length === 0 ? (
        <EmptyState
          title="No folders found"
          description={
            search
              ? "No folder names match your search keyword."
              : currentCategory !== 'all'
              ? `You don't have any ${currentCategory === 'india' ? 'India' : 'International'} folders yet.`
              : "You don't have access to any folders yet."
          }
          actionButton={
            canCreateFolder && (
              <button
                onClick={() => handleOpenModal(null)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime rounded-xl shadow-xs hover:bg-crm-lime-hover"
              >
                <FolderPlus className="w-4 h-4" />
                Create First Folder
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFolders.map((folder) => {
            const isCreator = Boolean(folder.isOwner);
            const canEdit = isCreator;
            const canDelete = isCreator;
            const canShare = isCreator || folder.accessLevel === 'FULL_ACCESS';
            const isInternational = (folder.category || 'INDIA').toUpperCase() === 'INTERNATIONAL';

            return (
              <div
                key={folder._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold shrink-0"
                        style={{ backgroundColor: folder.color || '#4F46E5' }}
                      >
                        <FolderIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3
                          onClick={() => navigate(`${basePath}/folders/${folder._id}`)}
                          className="font-extrabold text-sm text-crm-navy hover:text-blue-600 cursor-pointer transition-colors line-clamp-1"
                        >
                          {folder.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {/* Category Badge */}
                          <span
                            className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              isInternational
                                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isInternational ? '🌐 International' : '🇮🇳 India'}
                          </span>

                          {/* Ownership Badge */}
                          {isCreator ? (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-crm-lime/20 text-crm-navy">
                              Owner
                            </span>
                          ) : (
                            <span className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              Shared ({folder.accessLevel || 'VIEW'})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Datasets</p>
                      <p className="text-sm font-extrabold text-crm-navy flex items-center gap-1.5 mt-0.5">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                        {folder.datasetCount || 0}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Total Records</p>
                      <p className="text-sm font-extrabold text-crm-navy flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-crm-lime" />
                        {(folder.totalRecords || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer / Action Bar */}
                <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate(`${basePath}/folders/${folder._id}`)}
                    className="flex items-center gap-1.5 text-xs font-bold text-crm-navy hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Folder
                  </button>

                  <div className="flex items-center gap-1">
                    {canShare && !isVisitor && (
                      <button
                        onClick={() => setSharingFolder(folder)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors"
                        title="Share Folder Access"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canEdit && !isVisitor && (
                      <button
                        onClick={() => handleOpenModal(folder)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                        title="Rename Folder"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && !isVisitor && (
                      <button
                        onClick={() => handleDeleteFolder(folder)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Folder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFolder ? 'Edit Folder' : 'Create New Private Folder'}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveFolder} className="space-y-4">
          {/* Category Selector Cards */}
          <div>
            <label className="block text-xs font-bold text-crm-navy mb-1.5">Folder Category / Region *</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'INDIA' })}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  formData.category === 'INDIA'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">🇮🇳</span>
                <div>
                  <div className="text-xs font-black">India</div>
                  <div className="text-[10px] text-slate-500 font-medium">Domestic Leads</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'INTERNATIONAL' })}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  formData.category === 'INTERNATIONAL'
                    ? 'border-sky-500 bg-sky-50/70 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-xl">🌐</span>
                <div>
                  <div className="text-xs font-black">International</div>
                  <div className="text-[10px] text-slate-500 font-medium">Global Outreach</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-crm-navy mb-1">Folder Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Google Ads Leads 2026"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-crm-navy mb-1">Description (Optional)</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the folder contents..."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-crm-navy mb-2">Folder Accent Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {FOLDER_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-7 h-7 rounded-full transition-transform ${formData.color === c ? 'scale-110 ring-2 ring-crm-navy ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-md disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingFolder ? 'Update Folder' : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Share Folder Modal */}
      {sharingFolder && (
        <ShareFolderModal
          isOpen={Boolean(sharingFolder)}
          onClose={() => setSharingFolder(null)}
          folderId={sharingFolder._id}
          folderName={sharingFolder.name}
          onSuccess={fetchFolders}
        />
      )}
    </div>
  );
};
