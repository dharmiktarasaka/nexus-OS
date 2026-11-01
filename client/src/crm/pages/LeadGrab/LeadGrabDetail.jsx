import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Download,
  Database,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Star,
  Search,
  Filter,
  CheckCircle2,
  Edit3,
  ExternalLink,
  MessageCircle,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  X,
  Flame,
  LayoutGrid,
  List,
  Target,
  FolderPlus,
  Folder,
  Gamepad2,
  Copy,
  Bot,
  ShieldCheck
} from 'lucide-react';
import Linkedin from '../../components/icons/LinkedinIcon';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ImportToFolderModal } from '../../components/ImportToFolderModal';
import { AiBlob } from '../../components/AiBlob';

export const LeadGrabDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const [campaign, setCampaign] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(false);
  const [hasEmailOnly, setHasEmailOnly] = useState(false);
  const [hasLinkedInOnly, setHasLinkedInOnly] = useState(false);
  const [minRatingFilter, setMinRatingFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Selected leads for bulk actions
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Dynamic AI Provider & Model Config State
  const [aiConfig, setAiConfig] = useState({
    activeAiProvider: 'gemini',
    geminiModel: 'gemini-2.5-flash',
    deepseekModel: 'deepseek-chat',
    hasGeminiKey: false,
    hasDeepseekKey: false
  });

  const fetchAiConfig = async () => {
    try {
      const res = await api.get('/lead-grab/ai-config');
      if (res.data?.success) {
        setAiConfig(res.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchAiConfig();
  }, []);

  const activeProvider = aiConfig.activeAiProvider || (aiConfig.hasGeminiKey ? 'gemini' : 'deepseek');
  const activeAiName = activeProvider === 'gemini'
    ? (aiConfig.geminiModel ? `Google Gemini (${aiConfig.geminiModel.replace(/^gemini-/, '')})` : 'Google Gemini')
    : (aiConfig.deepseekModel ? `DeepSeek AI (${aiConfig.deepseekModel.includes('/') ? aiConfig.deepseekModel.split('/')[1] : aiConfig.deepseekModel})` : 'DeepSeek AI');
  const shortAiName = activeProvider === 'gemini' ? 'Gemini' : 'DeepSeek';

  // Folder Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTargets, setImportTargets] = useState({
    leadIds: [],
    importAll: false,
    count: 0
  });

  // Editing Lead Modal
  const [editingLead, setEditingLead] = useState(null);

  // Fetch campaign info
  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/lead-grab/campaigns/${id}`);
      if (res.data?.success) {
        setCampaign(res.data.data);
      }
    } catch (err) {
      // Quiet fallback
    } finally {
      setLoading(false);
    }
  };

  // Fetch leads with active filters
  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      const params = {
        search: searchTerm,
        platform: platformFilter || undefined,
        status: statusFilter || undefined,
        hasPhone: hasPhoneOnly ? 'true' : undefined,
        hasEmail: hasEmailOnly ? 'true' : undefined,
        hasLinkedIn: hasLinkedInOnly ? 'true' : undefined,
        minRating: minRatingFilter || undefined,
        limit: 100
      };

      const res = await api.get(`/lead-grab/campaigns/${id}/leads`, { params });
      if (res.data?.success) {
        setLeads(res.data.data || []);
      }
    } catch (err) {
      // Quiet fallback
    } finally {
      setLeadsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  useEffect(() => {
    fetchLeads();
  }, [id, searchTerm, platformFilter, statusFilter, hasPhoneOnly, hasEmailOnly, hasLinkedInOnly, minRatingFilter]);

  // Polling for live extraction progress
  useEffect(() => {
    let interval;
    if (campaign && campaign.status === 'ACTIVE') {
      interval = setInterval(() => {
        fetchCampaign();
        fetchLeads();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [campaign?.status]);

  // Start campaign
  const handleStartCampaign = async () => {
    try {
      const res = await api.post(`/lead-grab/campaigns/${id}/start`);
      if (res.data?.success) {
        addToast('🚀 Lead grabber activated! Finding verified contacts...', 'success');
        fetchCampaign();
        fetchLeads();
      }
    } catch (err) {
      addToast('Failed to start campaign', 'error');
    }
  };

  // Pause campaign
  const handlePauseCampaign = async () => {
    try {
      const res = await api.post(`/lead-grab/campaigns/${id}/pause`);
      if (res.data?.success) {
        addToast('Campaign paused', 'info');
        fetchCampaign();
      }
    } catch (err) {
      addToast('Failed to pause campaign', 'error');
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async () => {
    if (!window.confirm('Are you sure you want to delete this campaign and all its leads?')) return;
    try {
      const res = await api.delete(`/lead-grab/campaigns/${id}`);
      if (res.data?.success) {
        addToast('Campaign deleted', 'success');
        navigate(`${basePath}/leads-grab`);
      }
    } catch (err) {
      addToast('Failed to delete campaign', 'error');
    }
  };

  // Open Modal for Single Lead Import
  const handleOpenSingleImportModal = (leadId) => {
    setImportTargets({
      leadIds: [leadId],
      importAll: false,
      count: 1
    });
    setIsImportModalOpen(true);
  };

  // Open Modal for Bulk Selected Leads Import
  const handleOpenBulkImportModal = () => {
    if (selectedLeadIds.length === 0) {
      addToast('Please select at least one lead to import', 'warning');
      return;
    }
    setImportTargets({
      leadIds: selectedLeadIds,
      importAll: false,
      count: selectedLeadIds.length
    });
    setIsImportModalOpen(true);
  };

  // Open Modal for All Campaign Leads Import
  const handleOpenAllImportModal = () => {
    if (leads.length === 0) {
      addToast('No leads available to import', 'warning');
      return;
    }
    setImportTargets({
      leadIds: [],
      importAll: true,
      count: campaign?.extractedCount || leads.length
    });
    setIsImportModalOpen(true);
  };

  // Handle successful import into folder & CRM
  const handleImportSuccess = ({ folderId, folderName, openFolder }) => {
    setSelectedLeadIds([]);
    fetchLeads();
    fetchCampaign();
    if (openFolder && folderId) {
      navigate(`${basePath}/folders/${folderId}`);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/lead-grab/campaigns/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_${campaign?.name?.replace(/\s+/g, '_') || 'campaign'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('CSV export downloaded!', 'success');
    } catch (err) {
      addToast('Failed to export leads', 'error');
    }
  };

  // Select all toggler
  const handleToggleSelectAll = () => {
    if (selectedLeadIds.length === leads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(leads.map((l) => l._id));
    }
  };

  const handleToggleSelectOne = (leadId) => {
    if (selectedLeadIds.includes(leadId)) {
      setSelectedLeadIds(selectedLeadIds.filter((lid) => lid !== leadId));
    } else {
      setSelectedLeadIds([...selectedLeadIds, leadId]);
    }
  };

  // Lead status update
  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await api.put(`/lead-grab/leads/${leadId}`, { status: newStatus });
      if (res.data?.success) {
        addToast('Status updated', 'success');
        setLeads(leads.map(l => l._id === leadId ? { ...l, status: newStatus } : l));
      }
    } catch (err) {
      addToast('Failed to update status', 'error');
    }
  };

  // Dynamic AI on-demand lead enrichment
  const [analyzingLeadId, setAnalyzingLeadId] = useState(null);
  const handleAiAnalyzeLead = async (leadId) => {
    setAnalyzingLeadId(leadId);
    try {
      const res = await api.post(`/lead-grab/leads/${leadId}/ai-analyze`);
      if (res.data?.success) {
        const updatedLead = res.data.data;
        if (updatedLead) {
          setLeads(prev => prev.map(l => l._id === leadId ? { ...l, ...updatedLead } : l));
        }
        addToast(res.data.message || `✨ ${activeAiName} found missing contact details!`, 'success');
        fetchCampaign();
      }
    } catch (err) {
      addToast(err.response?.data?.message || `${activeAiName} analysis failed. Configure API key in Settings.`, 'error');
    } finally {
      setAnalyzingLeadId(null);
    }
  };

  // Bulk AI enrichment for all missing leads in this campaign
  const [isBulkEnriching, setIsBulkEnriching] = useState(false);
  const [isDeduplicating, setIsDeduplicating] = useState(false);

  // Auto-Deduplicate & Replace duplicate leads
  const handleDeduplicateCampaign = async () => {
    if (!id) return;
    setIsDeduplicating(true);
    addToast('🛡️ Scanning and removing duplicate leads from campaign...', 'info');
    try {
      const res = await api.post(`/lead-grab/campaigns/${id}/deduplicate`, { autoReplenish: true });
      if (res.data?.success) {
        addToast(res.data.message || '✨ Deduplication complete! All leads are 100% unique.', 'success');
        fetchLeads();
        fetchCampaign();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Deduplication failed', 'error');
    } finally {
      setIsDeduplicating(false);
    }
  };

  const handleBulkEnrichAll = async () => {
    if (!id) return;
    setIsBulkEnriching(true);
    addToast(`🤖 ${activeAiName} started bulk contact discovery & enrichment...`, 'info');
    try {
      const res = await api.post(`/lead-grab/campaigns/${id}/ai-enrich-all`);
      if (res.data?.success) {
        addToast(res.data.message || `✨ ${activeAiName} bulk enrichment completed!`, 'success');
        fetchLeads();
        fetchCampaign();
      }
    } catch (err) {
      addToast(err.response?.data?.message || `Bulk AI enrichment failed. Check ${activeAiName} API key in Settings.`, 'error');
    } finally {
      setIsBulkEnriching(false);
    }
  };

  // Copy selected outreach pitches to clipboard
  const handleCopySelectedPitches = () => {
    const selectedLeads = leads.filter(l => selectedLeadIds.includes(l._id));
    const pitches = selectedLeads
      .map(l => {
        const pitch = l.rawDetails?.discordPitch || l.rawDetails?.pitch || (l.notes?.includes('Pitch') ? l.notes : '');
        return `[${l.name} - ${l.decisionMaker || 'Leader'}]\n${pitch || `Hi ${l.decisionMaker?.split(' - ')[0] || 'there'}, loved your work at ${l.name}. Let's connect!`}\n`;
      })
      .join('\n---\n\n');
    
    if (!pitches.trim()) {
      addToast('No pitches available for selected leads', 'warning');
      return;
    }
    navigator.clipboard.writeText(pitches);
    addToast(`📋 Copied ${selectedLeads.length} outreach pitches to clipboard!`, 'success');
  };

  // Copy selected emails
  const handleCopySelectedEmails = () => {
    const emails = leads
      .filter(l => selectedLeadIds.includes(l._id) && l.email)
      .map(l => l.email);
    
    if (emails.length === 0) {
      addToast('No emails found among selected leads', 'warning');
      return;
    }
    navigator.clipboard.writeText(emails.join(', '));
    addToast(`✉️ Copied ${emails.length} email addresses to clipboard!`, 'success');
  };

  // Save edited lead modal
  const handleSaveLeadEdit = async (e) => {
    e.preventDefault();
    if (!editingLead) return;
    try {
      const res = await api.put(`/lead-grab/leads/${editingLead._id}`, {
        name: editingLead.name,
        decisionMaker: editingLead.decisionMaker,
        phone: editingLead.phone,
        email: editingLead.email,
        websiteUrl: editingLead.websiteUrl,
        linkedinUrl: editingLead.linkedinUrl,
        location: editingLead.location,
        status: editingLead.status,
        notes: editingLead.notes
      });
      if (res.data?.success) {
        addToast('Lead saved successfully', 'success');
        setEditingLead(null);
        fetchLeads();
      }
    } catch (err) {
      addToast('Failed to save lead', 'error');
    }
  };

  // Delete single lead
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Delete this grabbed lead?')) return;
    try {
      const res = await api.delete(`/lead-grab/leads/${leadId}`);
      if (res.data?.success) {
        addToast('Lead deleted', 'success');
        setLeads(leads.filter(l => l._id !== leadId));
        fetchCampaign();
      }
    } catch (err) {
      addToast('Failed to delete lead', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
        <h3 className="text-base font-black text-slate-800">Campaign Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">This campaign may have been deleted.</p>
        <button
          onClick={() => navigate(`${basePath}/leads-grab`)}
          className="px-4 py-2 bg-crm-navy text-white text-xs font-bold rounded-xl"
        >
          Return to Campaigns
        </button>
      </div>
    );
  }

  const isActive = campaign.status === 'ACTIVE';
  const isCompleted = campaign.status === 'COMPLETED';
  const progressPercent = campaign.progress || 0;

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`${basePath}/leads-grab`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-crm-navy transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Lead Grab Campaigns</span>
        </button>

        <div className="flex items-center gap-2">
          {isActive ? (
            <button
              onClick={handlePauseCampaign}
              className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Grabbing</span>
            </button>
          ) : (
            <button
              onClick={handleStartCampaign}
              className="px-4 py-1.5 rounded-xl bg-crm-lime hover:bg-crm-lime-hover text-crm-navy text-xs font-black flex items-center gap-1.5 shadow-md shadow-crm-lime/20 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompleted ? 'Re-Run Lead Grab' : 'Start Grabbing Leads'}</span>
            </button>
          )}

          {/* Deduplicate & Clean */}
          <button
            onClick={handleDeduplicateCampaign}
            disabled={isDeduplicating || leads.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-black flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
            title="Scan for duplicate leads, delete them, and automatically fetch brand new unique leads"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-emerald-600 ${isDeduplicating ? 'animate-spin' : ''}`} />
            <span>{isDeduplicating ? 'Cleaning Duplicates...' : 'Auto-Deduplicate'}</span>
          </button>

          {/* Enrich All Missing Contacts with AI */}
          <button
            onClick={handleBulkEnrichAll}
            disabled={isBulkEnriching || leads.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 hover:border-purple-300 text-purple-700 text-xs font-black flex items-center gap-2 shadow-2xs transition-all disabled:opacity-50"
            title={`Automatically discover missing emails, phones, and decision makers with ${activeAiName}`}
          >
            {isBulkEnriching ? (
              <AiBlob size={18} speed={2.0} glow={true} glowColor="rgba(168, 85, 247, 0.7)" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            )}
            <span>{isBulkEnriching ? `${shortAiName} Enriching All...` : `Enrich All with ${shortAiName}`}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDeleteCampaign}
            className="p-2 rounded-xl bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 text-xs font-bold shadow-2xs"
            title="Delete campaign"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Campaign Details Header Card */}
      <div className="bg-crm-navy rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-crm-navy/15 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-crm-lime/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-crm-lime text-crm-navy text-xs font-black uppercase tracking-wider">
                  <Target className="w-3 h-3" />
                  {campaign.niche}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-bold">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {campaign.targetCity}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isActive
                      ? 'bg-crm-lime/20 text-crm-lime border border-crm-lime/40 animate-pulse'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {campaign.status}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{campaign.name}</h1>
            </div>

            {/* Target vs Extracted Big Pill */}
            <div className="bg-white/10 border border-white/15 rounded-2xl p-3.5 px-5 flex items-center gap-4 shrink-0">
              <div>
                <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Grabbed Leads</p>
                <p className="text-2xl font-black text-crm-lime">
                  {campaign.extractedCount || leads.length}
                  <span className="text-sm font-bold text-white/60"> / {campaign.targetCount} target</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-crm-lime/20 flex items-center justify-center font-black text-crm-lime text-sm">
                {Math.round((((campaign.extractedCount || leads.length) / campaign.targetCount) * 100))}%
              </div>
            </div>
          </div>

          {/* Active Scraping Progress Bar */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-crm-lime animate-ping" />
                )}
                {campaign.currentStep || 'Extraction ready'}
              </span>
              <span className="font-black text-crm-lime">{progressPercent}%</span>
            </div>

            <div className="w-full h-2.5 bg-black/30 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isActive ? 'bg-crm-lime shadow-md shadow-crm-lime/50' : 'bg-crm-lime'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Aggregate Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 font-bold block">PHONE NUMBERS</span>
              <span className="text-base font-black text-white">{campaign.stats?.withPhone || leads.filter(l => l.phone).length}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 font-bold block">VERIFIED EMAILS</span>
              <span className="text-base font-black text-white">{campaign.stats?.withEmail || leads.filter(l => l.email).length}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 font-bold block">LINKEDIN PROFILES</span>
              <span className="text-base font-black text-white">{campaign.stats?.withLinkedIn || leads.filter(l => l.linkedinUrl).length}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center">
              <span className="text-[10px] text-slate-300 font-bold block">WEBSITES FOUND</span>
              <span className="text-base font-black text-white">{campaign.stats?.withWebsite || leads.filter(l => l.websiteUrl).length}</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/10 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] text-crm-lime font-bold block">SYNCED TO CRM</span>
              <span className="text-base font-black text-crm-lime">{campaign.stats?.importedToCRM || leads.filter(l => l.isImportedToCRM).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search leads by business name, decision maker, phone, email, address..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-lime transition-all"
            />
          </div>

          {/* Quick Platform Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-crm-lime"
            >
              <option value="">All Sources</option>
              <option value="Google Maps">Google Maps</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Web Directory">Web Directory</option>
              <option value="Yelp & Local">Yelp & Local</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-crm-lime"
            >
              <option value="">All Lead Statuses</option>
              <option value="NEW">NEW</option>
              <option value="CONTACTED">CONTACTED</option>
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="HOT">HOT</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-white text-crm-navy shadow-xs font-bold' : 'text-slate-500'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-white text-crm-navy shadow-xs font-bold' : 'text-slate-500'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips & Bulk Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setHasPhoneOnly(!hasPhoneOnly)}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                hasPhoneOnly ? 'bg-crm-navy text-crm-lime' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📞 Has Phone
            </button>
            <button
              onClick={() => setHasEmailOnly(!hasEmailOnly)}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                hasEmailOnly ? 'bg-crm-navy text-crm-lime' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ✉️ Has Email
            </button>
            <button
              onClick={() => setHasLinkedInOnly(!hasLinkedInOnly)}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                hasLinkedInOnly ? 'bg-crm-navy text-crm-lime' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              💼 Has LinkedIn
            </button>
            <button
              onClick={() => setMinRatingFilter(minRatingFilter ? '' : '4.5')}
              className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                minRatingFilter ? 'bg-crm-navy text-crm-lime' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ⭐ 4.5+ Rating
            </button>
          </div>

          {/* Bulk Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleToggleSelectAll}
              className="text-xs font-bold text-slate-600 hover:text-crm-navy px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
            >
              {selectedLeadIds.length === leads.length && leads.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-crm-lime" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Select All ({selectedLeadIds.length})</span>
            </button>

            {selectedLeadIds.length > 0 ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleCopySelectedPitches}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                  title="Copy outreach pitches of selected leads"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Pitches ({selectedLeadIds.length})</span>
                </button>

                <button
                  onClick={handleCopySelectedEmails}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
                  title="Copy email addresses of selected leads"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Emails</span>
                </button>

                <button
                  onClick={handleOpenBulkImportModal}
                  disabled={bulkLoading}
                  className="px-3.5 py-1.5 bg-crm-navy text-crm-lime hover:bg-crm-navy-light text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>Import {selectedLeadIds.length} to Folder</span>
                </button>
              </div>
            ) : leads.length > 0 ? (
              <button
                onClick={handleOpenAllImportModal}
                className="px-3.5 py-1.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy text-xs font-black rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Import All to Folder</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Leads Table / Grid Content */}
      {leadsLoading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading campaign leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-crm-lime/20 text-crm-navy flex items-center justify-center mx-auto mb-4 font-black">
            <Search className="w-8 h-8 text-crm-navy" />
          </div>
          <h3 className="text-base font-black text-slate-800">No Leads Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            {campaign.extractedCount === 0
              ? 'Click "Start Grabbing Leads" above to begin finding verified niche contacts!'
              : 'No leads matched your filter criteria.'}
          </p>
          {campaign.extractedCount === 0 && (
            <button
              onClick={handleStartCampaign}
              className="px-5 py-2.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy font-black text-xs rounded-xl shadow-md shadow-crm-lime/20 inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Grabbing Now
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Detailed Table View */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedLeadIds.length === leads.length && leads.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-crm-navy accent-crm-navy cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-4 min-w-[280px]">Company & Decision Maker</th>
                  <th className="py-4 px-4 min-w-[220px]">Direct Contact Info</th>
                  <th className="py-4 px-4 min-w-[180px]">Location & Reviews</th>
                  <th className="py-4 px-4 min-w-[170px]">Source & Pipeline</th>
                  <th className="py-4 px-4 min-w-[200px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {leads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead._id);
                  const isImported = lead.isImportedToCRM;
                  const initial = (lead.name || 'C').charAt(0).toUpperCase();

                  // Clean DM display so it doesn't repeat the long company name
                  let cleanDm = lead.decisionMaker || '';
                  if (cleanDm.includes(' - ')) {
                    const parts = cleanDm.split(' - ');
                    cleanDm = parts[0] + (parts[1] && !parts[1].toLowerCase().includes(lead.name.toLowerCase()) ? ` (${parts[1]})` : '');
                  }

                  return (
                    <tr
                      key={lead._id}
                      className={`hover:bg-slate-50/90 transition-all group ${
                        isSelected ? 'bg-crm-lime/8' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(lead._id)}
                          className="w-4 h-4 rounded text-crm-navy accent-crm-navy cursor-pointer"
                        />
                      </td>

                      {/* Business Name & Decision Maker */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-crm-navy text-crm-lime font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-white/10">
                            {initial}
                          </div>
                          <div className="min-w-0 max-w-[260px]">
                            <p className="font-extrabold text-slate-900 text-sm truncate" title={lead.name}>
                              {lead.name}
                            </p>
                            {cleanDm ? (
                              <p className="text-[11px] font-bold text-slate-600 truncate mt-0.5" title={lead.decisionMaker}>
                                <span className="text-crm-navy font-black">DM:</span> {cleanDm}
                              </p>
                            ) : null}
                            {lead.websiteUrl ? (
                              <a
                                href={lead.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold truncate hover:underline mt-0.5 max-w-[220px]"
                              >
                                <Globe className="w-3 h-3 shrink-0" />
                                <span className="truncate">{lead.websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1.5">
                          {lead.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-800 text-xs tracking-tight">{lead.phone}</span>
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:scale-105 transition-all shadow-2xs"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle className="w-3 h-3" />
                              </a>
                              <a
                                href={`tel:${lead.phone}`}
                                className="p-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 hover:scale-105 transition-all"
                                title="Call phone"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">No phone found</span>
                          )}

                          {lead.email ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`mailto:${lead.email}`}
                                className="inline-flex items-center gap-1.5 text-[11px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-2 py-0.5 rounded-md font-bold truncate max-w-[200px] border border-sky-100"
                                title={`Send email to ${lead.email}`}
                              >
                                <Mail className="w-3 h-3 shrink-0 text-sky-600" />
                                <span className="truncate">{lead.email}</span>
                              </a>
                            </div>
                          ) : analyzingLeadId === lead._id ? (
                            <div
                              className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-purple-700 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-indigo-50 px-2.5 py-1 rounded-md border border-purple-300/80 shadow-2xs animate-pulse"
                              title={`${activeAiName} is analyzing web & discovering verified info...`}
                            >
                              <AiBlob size={16} speed={2.2} roughness={0.5} amplitude={0.3} glow={true} glowColor="rgba(168, 85, 247, 0.6)" />
                              <span className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent font-black tracking-wide">
                                Searching...
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAiAnalyzeLead(lead._id)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 hover:border-purple-300 px-2.5 py-1 rounded-md border border-purple-200/80 transition-all shadow-2xs hover:shadow-xs"
                              title={`Search verified contact info with ${activeAiName}`}
                            >
                              <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                              <span>Find Info with {shortAiName}</span>
                            </button>
                          )}

                          {/* Social links */}
                          <div className="flex items-center gap-1.5">
                            {lead.linkedinUrl ? (
                              <a
                                href={lead.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-sky-700 bg-sky-50 hover:bg-sky-100 px-1.5 py-0.5 rounded font-bold"
                              >
                                <Linkedin className="w-2.5 h-2.5" />
                                <span>LinkedIn</span>
                              </a>
                            ) : null}

                            {lead.rawDetails?.discordInviteUrl ? (
                              <a
                                href={lead.rawDetails.discordInviteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-[#5865F2] bg-[#5865F2]/10 hover:bg-[#5865F2]/20 px-1.5 py-0.5 rounded font-bold"
                              >
                                <Gamepad2 className="w-2.5 h-2.5" />
                                <span>Join Server</span>
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Location & Rating */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1">
                          <p className="text-[11px] text-slate-600 font-medium flex items-center gap-1 max-w-[180px] truncate" title={lead.location || lead.city}>
                            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="truncate">{lead.city || lead.location || 'Global'}</span>
                          </p>

                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px]">
                            <span className="flex items-center gap-0.5 text-amber-700 font-black">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {lead.rating || 4.7}
                            </span>
                            <span className="text-amber-600 font-semibold text-[10px]">
                              ({lead.reviewCount || 35} reviews)
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Source Platform & Status */}
                      <td className="py-3.5 px-4 align-middle">
                        <div className="space-y-1.5">
                          {lead.sourcePlatform?.includes('Discord') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#5865F2]/10 text-[#5865F2] text-[10px] font-black uppercase tracking-wider border border-[#5865F2]/20">
                              <Gamepad2 className="w-3 h-3" />
                              <span>Discord</span>
                            </span>
                          ) : lead.sourcePlatform?.includes('TinyFish') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase tracking-wider border border-cyan-200">
                              <Bot className="w-3 h-3 text-cyan-600" />
                              <span>TinyFish AI</span>
                            </span>
                          ) : lead.sourcePlatform?.includes('Google') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>Google Maps</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                              <Globe className="w-3 h-3 text-slate-500" />
                              <span>Web</span>
                            </span>
                          )}

                          <div>
                            <select
                              value={lead.status}
                              onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border focus:outline-hidden cursor-pointer transition-all ${
                                lead.status === 'HOT'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-black'
                                  : lead.status === 'QUALIFIED'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : lead.status === 'CONTACTED'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="NEW">🟢 NEW</option>
                              <option value="CONTACTED">🟡 CONTACTED</option>
                              <option value="QUALIFIED">🟣 QUALIFIED</option>
                              <option value="HOT">🔥 HOT</option>
                              <option value="NOT_INTERESTED">⚪ NOT INTERESTED</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* CRM Sync & Actions */}
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isImported ? (
                            <Link
                              to={`/leads`}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black inline-flex items-center gap-1 shadow-2xs hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>In CRM</span>
                            </Link>
                          ) : (
                            <button
                              onClick={() => handleOpenSingleImportModal(lead._id)}
                              className="px-3 py-1.5 bg-crm-navy hover:bg-crm-navy-light text-crm-lime text-xs font-black rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap"
                            >
                              <FolderPlus className="w-3.5 h-3.5" />
                              <span>Import</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleAiAnalyzeLead(lead._id)}
                            disabled={analyzingLeadId === lead._id}
                            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/60 transition-all disabled:opacity-50 shadow-2xs"
                            title="Analyze & Enrich with DeepSeek AI"
                          >
                            {analyzingLeadId === lead._id ? (
                              <div className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            )}
                          </button>

                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shadow-2xs"
                            title="Edit lead notes & details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteLead(lead._id)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-500 transition-colors shadow-2xs"
                            title="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {leads.map((lead) => {
            const isSelected = selectedLeadIds.includes(lead._id);
            const isImported = lead.isImportedToCRM;
            const initial = (lead.name || 'C').charAt(0).toUpperCase();

            return (
              <div
                key={lead._id}
                className={`bg-white rounded-3xl border p-5 space-y-4 shadow-sm transition-all flex flex-col justify-between hover:shadow-md ${
                  isSelected ? 'border-crm-lime ring-2 ring-crm-lime/40 bg-crm-lime/5' : 'border-slate-200/90'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(lead._id)}
                        className="w-4 h-4 rounded text-crm-navy accent-crm-navy cursor-pointer"
                      />
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-slate-100 rounded-lg text-slate-700 border border-slate-200/60">
                        {lead.sourcePlatform || 'Web'}
                      </span>
                    </div>

                    <div className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-lg text-xs font-black">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{lead.rating || 4.7}</span>
                    </div>
                  </div>

                  {/* Business Name Header */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-crm-navy text-crm-lime font-black text-sm flex items-center justify-center shrink-0 shadow-xs border border-white/10">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-base text-slate-900 truncate" title={lead.name}>{lead.name}</h3>
                      {lead.decisionMaker ? (
                        <p className="text-xs font-bold text-slate-600 truncate mt-0.5">{lead.decisionMaker}</p>
                      ) : null}
                    </div>
                  </div>

                  {/* Contact Info Badges */}
                  <div className="space-y-2 text-xs pt-1 border-t border-slate-100">
                    {lead.phone ? (
                      <div className="flex items-center justify-between text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="font-mono font-bold flex items-center gap-1.5 text-slate-900">
                          <Phone className="w-3.5 h-3.5 text-crm-lime" />
                          {lead.phone}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1 rounded-md bg-slate-200/70 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {lead.email ? (
                      <div className="flex items-center gap-2 text-sky-800 bg-sky-50/80 p-2 rounded-xl border border-sky-100 font-semibold truncate">
                        <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <a href={`mailto:${lead.email}`} className="truncate hover:underline text-xs">{lead.email}</a>
                      </div>
                    ) : analyzingLeadId === lead._id ? (
                      <div
                        className="w-full py-2 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-indigo-50 border border-purple-300/90 text-purple-700 rounded-xl text-xs font-black flex items-center justify-center gap-2.5 shadow-xs animate-pulse"
                        title={`${activeAiName} is analyzing web & discovering verified info...`}
                      >
                        <AiBlob size={22} speed={2.2} roughness={0.5} amplitude={0.32} glow={true} glowColor="rgba(168, 85, 247, 0.7)" />
                        <span className="bg-gradient-to-r from-purple-700 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent font-black tracking-wide">
                          {shortAiName} Finding Info...
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAiAnalyzeLead(lead._id)}
                        className="w-full text-center py-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200 hover:border-purple-300 text-purple-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs"
                        title={`Search verified contact info with ${activeAiName}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>Find Info with {shortAiName}</span>
                      </button>
                    )}

                    {lead.websiteUrl ? (
                      <div className="flex items-center gap-1.5 text-sky-600 truncate font-semibold px-1">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <a
                          href={lead.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline text-xs"
                        >
                          {lead.websiteUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate px-1">
                      <MapPin className="w-3 h-3 shrink-0 text-rose-400" />
                      <span className="truncate">{lead.location || lead.city || 'Global'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <select
                    value={lead.status}
                    onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 cursor-pointer"
                  >
                    <option value="NEW">🟢 NEW</option>
                    <option value="CONTACTED">🟡 CONTACTED</option>
                    <option value="QUALIFIED">🟣 QUALIFIED</option>
                    <option value="HOT">🔥 HOT</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    {isImported ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In CRM</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenSingleImportModal(lead._id)}
                        className="px-3 py-1.5 bg-crm-navy hover:bg-crm-navy-light text-crm-lime text-xs font-black rounded-xl shadow-xs inline-flex items-center gap-1 transition-all active:scale-95"
                      >
                        <FolderPlus className="w-3.5 h-3.5" />
                        <span>Import</span>
                      </button>
                    )}

                    <button
                      onClick={() => setEditingLead(lead)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Edit lead"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteLead(lead._id)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-rose-500 transition-colors"
                      title="Delete lead"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-crm-navy px-6 py-4 flex items-center justify-between text-white border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-crm-lime" />
                <h3 className="text-sm font-black">Edit Grabbed Lead</h3>
              </div>
              <button onClick={() => setEditingLead(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeadEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Business Name</label>
                <input
                  type="text"
                  required
                  value={editingLead.name}
                  onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Decision Maker / Executive</label>
                <input
                  type="text"
                  value={editingLead.decisionMaker || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, decisionMaker: e.target.value })}
                  placeholder="e.g. John Doe - Founder & CEO"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website URL</label>
                  <input
                    type="text"
                    value={editingLead.websiteUrl || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">LinkedIn URL</label>
                  <input
                    type="text"
                    value={editingLead.linkedinUrl || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Address</label>
                <input
                  type="text"
                  value={editingLead.location || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={editingLead.status}
                  onChange={(e) => setEditingLead({ ...editingLead, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="QUALIFIED">QUALIFIED</option>
                  <option value="HOT">🔥 HOT</option>
                  <option value="NOT_INTERESTED">NOT INTERESTED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes & Intelligence</label>
                <textarea
                  rows="3"
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLead(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy font-black rounded-xl shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import to Folder & CRM Modal */}
      {campaign && (
        <ImportToFolderModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          campaign={campaign}
          selectedCount={importTargets.count}
          leadIds={importTargets.leadIds}
          importAll={importTargets.importAll}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};
