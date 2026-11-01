import React, { useState, useEffect } from 'react';
import {
  FolderPlus,
  Folder,
  Database,
  Mail,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Palette,
  Layers,
  Globe,
  MapPin,
  X
} from 'lucide-react';
import { Modal } from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const PRESET_COLORS = [
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Purple', value: '#6366F1' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Sky Blue', value: '#0284C7' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Rose', value: '#E11D48' }
];

export const ImportToFolderModal = ({
  isOpen,
  onClose,
  campaign,
  selectedCount = 0,
  leadIds = [],
  importAll = false,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [folderName, setFolderName] = useState('');
  const [folderCategory, setFolderCategory] = useState('INDIA'); // 'INDIA' | 'INTERNATIONAL'
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#4F46E5');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [existingFolders, setExistingFolders] = useState([]);
  const [existingCategoryFilter, setExistingCategoryFilter] = useState('ALL');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [openFolderAfter, setOpenFolderAfter] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize default folder name when opening modal
  useEffect(() => {
    if (isOpen) {
      const defaultName = campaign?.name
        ? `${campaign.name} - Leads`
        : `Leads - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      setFolderName(defaultName);
      setFolderCategory('INDIA');
      setFolderDescription(`Imported from Lead Grab campaign: ${campaign?.niche || 'Niche'} in ${campaign?.targetCity || 'City'}`);
      setFolderColor('#4F46E5');
      setMode('new');
      setExistingCategoryFilter('ALL');
      fetchExistingFolders();
    }
  }, [isOpen, campaign]);

  const fetchExistingFolders = async () => {
    try {
      setLoadingFolders(true);
      const res = await api.get('/folders');
      if (res.data?.success && Array.isArray(res.data.folders)) {
        setExistingFolders(res.data.folders);
        if (res.data.folders.length > 0) {
          setSelectedFolderId(res.data.folders[0]._id);
        }
      }
    } catch (err) {
      // Quiet fallback
    } finally {
      setLoadingFolders(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'new' && !folderName.trim()) {
      showError('Please enter a folder name');
      return;
    }

    if (mode === 'existing' && !selectedFolderId) {
      showError('Please select a folder');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        leadIds,
        importAll,
        ...(mode === 'new'
          ? {
              folderName: folderName.trim(),
              folderDescription: folderDescription.trim(),
              folderColor,
              folderCategory,
              category: folderCategory
            }
          : {
              folderId: selectedFolderId
            })
      };

      const res = await api.post(`/lead-grab/campaigns/${campaign._id}/bulk-import-to-crm`, payload);

      if (res.data?.success) {
        showSuccess(res.data.message || 'Leads imported successfully!');
        if (onSuccess) {
          onSuccess({
            folderId: res.data.folderId,
            folderName: res.data.folderName || folderName,
            category: folderCategory,
            openFolder: openFolderAfter
          });
        }
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to import leads to folder');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExistingFolders = existingFolders.filter(f => {
    if (existingCategoryFilter === 'ALL') return true;
    return (f.category || 'INDIA').toUpperCase() === existingCategoryFilter;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import Grabbed Leads to Folder & CRM"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Lead Count Badge Banner */}
        <div className="p-4 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-md border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crm-lime/20 text-crm-lime flex items-center justify-center font-black">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-tight">
                Importing {importAll ? 'All Campaign Leads' : `${selectedCount} Selected Leads`}
              </h4>
              <p className="text-[11px] text-slate-300">
                Categorize leads into India or International folders ready for outreach
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-crm-lime text-crm-navy font-black text-xs rounded-full shadow-xs">
            {importAll ? `${campaign?.extractedCount || 0} Leads` : `${selectedCount} Leads`}
          </span>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('new')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              mode === 'new'
                ? 'bg-white text-crm-navy shadow-sm'
                : 'text-slate-600 hover:text-crm-navy'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-crm-lime" />
            <span>Create New Folder</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              mode === 'existing'
                ? 'bg-white text-crm-navy shadow-sm'
                : 'text-slate-600 hover:text-crm-navy'
            }`}
          >
            <Folder className="w-4 h-4 text-sky-600" />
            <span>Add to Existing ({existingFolders.length})</span>
          </button>
        </div>

        {/* Mode: Create New Folder */}
        {mode === 'new' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Step 1: India vs International Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Destination Market / Region <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFolderCategory('INDIA')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    folderCategory === 'INDIA'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl">🇮🇳</span>
                  <div>
                    <div className="text-xs font-black text-emerald-950">India</div>
                    <div className="text-[10px] text-emerald-700 font-medium">Domestic Market Leads</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFolderCategory('INTERNATIONAL')}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                    folderCategory === 'INTERNATIONAL'
                      ? 'border-sky-500 bg-sky-50/80 text-sky-950 ring-2 ring-sky-500/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-2xl">🌐</span>
                  <div>
                    <div className="text-xs font-black text-sky-950">International</div>
                    <div className="text-[10px] text-sky-700 font-medium">Global / Overseas Outreach</div>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Folder Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Dentists in New York - Batch 1"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={folderDescription}
                onChange={(e) => setFolderDescription(e.target.value)}
                placeholder="Notes about this lead batch or outreach angle..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
              />
            </div>

            {/* Folder Color Palette */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-500" />
                <span>Folder Color Theme</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    onClick={() => setFolderColor(col.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      folderColor === col.value
                        ? 'border-crm-navy bg-slate-100 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs"
                      style={{ backgroundColor: col.value }}
                    />
                    <span>{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mode: Add to Existing Folder */}
        {mode === 'existing' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter Existing Folders by Category */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Filter by:</span>
              <button
                type="button"
                onClick={() => setExistingCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  existingCategoryFilter === 'ALL'
                    ? 'bg-crm-navy text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({existingFolders.length})
              </button>
              <button
                type="button"
                onClick={() => setExistingCategoryFilter('INDIA')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  existingCategoryFilter === 'INDIA'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>🇮🇳 India</span>
              </button>
              <button
                type="button"
                onClick={() => setExistingCategoryFilter('INTERNATIONAL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  existingCategoryFilter === 'INTERNATIONAL'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>🌐 International</span>
              </button>
            </div>

            {loadingFolders ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-crm-navy border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Loading your folders...</p>
              </div>
            ) : filteredExistingFolders.length === 0 ? (
              <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
                <p className="text-xs font-bold">No {existingCategoryFilter !== 'ALL' ? existingCategoryFilter.toLowerCase() : ''} folders found.</p>
                <p className="text-[11px] mt-1 text-amber-700">
                  Switch to "Create New Folder" to create a folder with your chosen category.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMode('new');
                    if (existingCategoryFilter !== 'ALL') setFolderCategory(existingCategoryFilter);
                  }}
                  className="mt-3 px-3.5 py-1.5 bg-amber-700 text-white text-xs font-black rounded-xl hover:bg-amber-800"
                >
                  Create New Folder
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Destination Folder <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                >
                  {filteredExistingFolders.map((f) => {
                    const catLabel = (f.category || 'INDIA').toUpperCase() === 'INTERNATIONAL' ? '🌐 International' : '🇮🇳 India';
                    return (
                      <option key={f._id} value={f._id}>
                        [{catLabel}] 📁 {f.name} ({f.totalRecords || 0} records)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Workflow Info Feature Box */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1.5 text-emerald-950">
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Ready for Instant Email Campaign</span>
          </div>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            All contact fields (business email, decision maker, website, phone, notes) are formatted into dynamic dataset records. You can select them inside the folder and click <strong>"Send Email"</strong> to launch personalized SMTP / Microsoft 365 cold email sequences with follow-ups!
          </p>
        </div>

        {/* Automatic Navigation Checkbox */}
        <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={openFolderAfter}
            onChange={(e) => setOpenFolderAfter(e.target.checked)}
            className="w-4 h-4 rounded text-crm-navy focus:ring-crm-navy border-slate-300"
          />
          <div className="text-xs">
            <span className="font-bold text-slate-800 block">Open Folder Immediately After Import</span>
            <span className="text-[11px] text-slate-500 block">
              Takes you straight into the folder to review leads and send emails
            </span>
          </div>
        </label>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || (mode === 'existing' && (!selectedFolderId || filteredExistingFolders.length === 0))}
            className="px-5 py-2.5 bg-crm-navy hover:bg-crm-navy-light text-crm-lime text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-crm-lime border-t-transparent rounded-full animate-spin" />
                <span>Importing Leads...</span>
              </>
            ) : (
              <>
                <Database className="w-4 h-4 text-crm-lime" />
                <span>
                  {mode === 'new'
                    ? `Create ${folderCategory === 'INTERNATIONAL' ? '🌐 International' : '🇮🇳 India'} Folder & Import`
                    : 'Import Leads to Folder'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
