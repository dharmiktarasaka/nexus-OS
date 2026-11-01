import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Users,
  MapPin,
  RefreshCw,
  HelpCircle,
  Briefcase,
  Save,
  ShieldAlert,
  SlidersHorizontal,
  Plus,
  UserPlus,
  Rocket,
  MessageSquareQuote,
  Flame,
  Globe,
  Send,
  Zap,
  Tag,
  Filter,
  CheckCheck,
  Heart,
  X,
  RotateCcw,
  Layers,
  LayoutGrid,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Download,
  Share2,
  FolderPlus,
  Folder,
  Palette,
  Database,
  Lock,
  LogIn,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle
} from 'lucide-react';
import Linkedin from '../components/icons/LinkedinIcon';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from '../components/Modal';

const POPULAR_IDEAS = [
  { label: 'Website Development', icon: '🌐' },
  { label: 'Graphic Designer', icon: '🎨' },
  { label: 'Python Developer', icon: '🐍' },
  { label: 'Real Estate in Dubai', icon: '🏢' },
  { label: 'Dentist', icon: '🦷' },
  { label: 'Mobile App Developer', icon: '📱' },
  { label: 'SEO & Marketing', icon: '📈' },
  { label: 'Solar Energy', icon: '⚡' }
];

const PRESET_COLORS = [
  { name: 'Indigo', value: '#4F46E5' },
  { name: 'Purple', value: '#6366F1' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Violet', value: '#7C3AED' },
  { name: 'Sky Blue', value: '#0284C7' },
  { name: 'Amber', value: '#D97706' },
  { name: 'Rose', value: '#E11D48' }
];

export const LinkedIn = () => {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  // Connection states
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [profile, setProfile] = useState(null);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedScope, setSelectedScope] = useState('openid profile email');
  const [showSecret, setShowSecret] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [bypassGate, setBypassGate] = useState(false);

  // Intent Post Extractor states
  const [searchNiche, setSearchNiche] = useState('Website Development');
  const [targetLocation, setTargetLocation] = useState('Global');
  const [searchCount, setSearchCount] = useState(15);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [selectedLeadForPitch, setSelectedLeadForPitch] = useState(null);
  const [generatedPitch, setGeneratedPitch] = useState('');
  const [intentFilter, setIntentFilter] = useState('ALL');

  // Swipe & Review Workflow states
  const [qualifiedLeads, setQualifiedLeads] = useState([]);
  const [dismissedLeads, setDismissedLeads] = useState([]);
  const [swipeHistory, setSwipeHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' | 'QUALIFIED' | 'DISMISSED'
  const [viewMode, setViewMode] = useState('SWIPE'); // 'SWIPE' | 'GRID'

  // Card Drag / Swipe Physics State
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeAnimation, setSwipeAnimation] = useState(null); // 'RIGHT' | 'LEFT' | null
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Import to Folder Modal States
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderMode, setFolderMode] = useState('new'); // 'new' | 'existing'
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#4F46E5');
  const [existingFolders, setExistingFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [importingToFolder, setImportingToFolder] = useState(false);
  const [openFolderAfter, setOpenFolderAfter] = useState(true);
  const [leadsToImport, setLeadsToImport] = useState([]);

  const redirectUri = window.location.origin + '/auth/linkedin/callback';

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/linkedin/status');
      if (res.data?.success) {
        const connected = Boolean(res.data.isConnected);
        setIsConnected(connected);
        setProfile(res.data.profile || null);
        if (res.data.clientId) {
          setClientId(res.data.clientId);
        }
        if (res.data.scope) {
          setSelectedScope(res.data.scope);
        }
        if (connected) {
          handleSearchIntentPosts('Website Development');
        }
      }
    } catch (err) {
      // Quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopyRedirectUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    showSuccess('Redirect URI copied to clipboard!');
    setTimeout(() => setCopiedUri(false), 2000);
  };

  const handleConnectOAuth = async (e) => {
    if (e) e.preventDefault();

    const enteredClientId = clientId.trim();
    const enteredClientSecret = clientSecret.trim();

    if (!enteredClientId) {
      showError('Please enter your LinkedIn App Client ID in Step 4');
      setActiveStep(4);
      return;
    }

    try {
      setConnecting(true);

      sessionStorage.setItem('linkedin_auth_config', JSON.stringify({
        clientId: enteredClientId,
        clientSecret: enteredClientSecret
      }));

      const params = new URLSearchParams({
        redirectUri,
        scope: selectedScope
      });
      params.append('clientId', enteredClientId);

      const res = await api.get(`/linkedin/auth-url?${params.toString()}`);

      if (res.data?.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        setConnecting(false);
        showError(res.data?.message || 'Please check your LinkedIn Client ID & Secret in Step 4.');
      }
    } catch (err) {
      setConnecting(false);
      const errMsg = err.response?.data?.message || 'Please check your LinkedIn Client ID & Secret from LinkedIn Developer Portal.';
      showError(errMsg);
    }
  };

  const handleSaveCredentials = async () => {
    if (!clientId.trim()) {
      showError('Please enter your LinkedIn Client ID');
      return;
    }
    try {
      setSaving(true);
      const res = await api.post('/linkedin/config', {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        scope: selectedScope
      });
      if (res.data?.success) {
        showSuccess('LinkedIn credentials saved successfully!');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your LinkedIn account?')) return;
    try {
      setDisconnecting(true);
      const res = await api.post('/linkedin/disconnect');
      if (res.data?.success) {
        showSuccess('LinkedIn account disconnected successfully');
        setIsConnected(false);
        setProfile(null);
        setClientSecret('');
        setSearchResults([]);
        setQualifiedLeads([]);
        setBypassGate(false);
      }
    } catch (err) {
      showError('Failed to disconnect LinkedIn account');
    } finally {
      setDisconnecting(false);
    }
  };

  // Search Extractor with unique ID tagging
  const handleSearchIntentPosts = async (customNiche) => {
    const nicheToUse = (typeof customNiche === 'string' ? customNiche : searchNiche).trim();
    if (!nicheToUse) {
      showError('Please enter or select a keyword / niche');
      return;
    }

    try {
      setSearching(true);
      setSearchError(null);
      setSearchResults([]);
      setSelectedLeadForPitch(null);

      const res = await api.post('/linkedin/search-posts', {
        niche: nicheToUse,
        targetLocation: targetLocation.trim() || 'Global',
        targetCount: parseInt(searchCount, 10) || 15
      });

      if (res.data?.success) {
        const rawLeads = res.data.leads || [];
        const leadsWithIds = rawLeads.map((item, idx) => ({
          ...item,
          id: item.id || `lead_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`
        }));
        setSearchResults(leadsWithIds);
        showSuccess(`Found ${leadsWithIds.length} live LinkedIn records for "${nicheToUse}"!`);
      } else {
        setSearchError(res.data?.message || 'No live records found');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to extract live LinkedIn leads';
      setSearchError(msg);
      showError(msg);
    } finally {
      setSearching(false);
    }
  };

  // --- SWIPE ACTIONS ---
  // Swipe Right = Qualify & Save
  const handleQualifyLead = async (lead) => {
    if (!lead) return;
    setSwipeAnimation('RIGHT');

    setTimeout(async () => {
      setSearchResults((prev) => prev.filter((item) => item.id !== lead.id && (item.postUrl || item.linkedinUrl) !== (lead.postUrl || lead.linkedinUrl)));
      setQualifiedLeads((prev) => [lead, ...prev]);
      setSwipeHistory((prev) => [...prev, { lead, action: 'QUALIFIED' }]);
      setSwipeAnimation(null);
      setDragOffset({ x: 0, y: 0 });

      try {
        await api.post('/leads', {
          name: lead.name,
          companyName: lead.companyName || lead.name,
          email: lead.email || '',
          phone: lead.phone || '',
          status: 'QUALIFIED',
          source: 'LinkedIn Qualified Lead',
          notes: `🎯 QUALIFIED LINKEDIN LEAD:\n"${lead.postContent}"\n\nPoster: ${lead.decisionMaker || lead.name}\nPost Link: ${lead.postUrl || lead.linkedinUrl}\nUrgency: ${lead.intentBadge || 'Active Need'}`
        });
        showSuccess(`🌟 Lead "${lead.name}" QUALIFIED and saved!`);
      } catch (err) {
        // Quiet fallback
      }
    }, 250);
  };

  // Swipe Left = Delete / Dismiss
  const handleDismissLead = (lead) => {
    if (!lead) return;
    setSwipeAnimation('LEFT');

    setTimeout(() => {
      setSearchResults((prev) => prev.filter((item) => item.id !== lead.id && (item.postUrl || item.linkedinUrl) !== (lead.postUrl || lead.linkedinUrl)));
      setDismissedLeads((prev) => [lead, ...prev]);
      setSwipeHistory((prev) => [...prev, { lead, action: 'DISMISSED' }]);
      setSwipeAnimation(null);
      setDragOffset({ x: 0, y: 0 });
      showSuccess(`Lead "${lead.name}" deleted / dismissed`);
    }, 250);
  };

  // Undo Last Swipe Action
  const handleUndoSwipe = () => {
    if (swipeHistory.length === 0) return;
    const lastItem = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, prev.length - 1));

    if (lastItem.action === 'QUALIFIED') {
      setQualifiedLeads((prev) => prev.filter((l) => l.id !== lastItem.lead.id));
    } else {
      setDismissedLeads((prev) => prev.filter((l) => l.id !== lastItem.lead.id));
    }

    setSearchResults((prev) => [lastItem.lead, ...prev]);
    showSuccess(`Restored "${lastItem.lead.name}" to queue`);
  };

  // HTML5 Pointer Events (Universal Mouse + Touch Drag)
  const handlePointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('button, a, input, textarea')) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setDragOffset({ x: dx, y: dy });
  };

  const handlePointerUp = (e, currentLead) => {
    if (!isDragging) return;
    setIsDragging(false);

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    if (dragOffset.x > 70) {
      handleQualifyLead(currentLead);
    } else if (dragOffset.x < -70) {
      handleDismissLead(currentLead);
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((!isConnected && !bypassGate) || activeTab !== 'QUEUE' || searchResults.length === 0) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const currentLead = searchResults[0];
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleQualifyLead(currentLead);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleDismissLead(currentLead);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, activeTab, isConnected, bypassGate]);

  const handleGeneratePitch = (lead) => {
    setSelectedLeadForPitch(lead);
    const firstName = lead.name.split(' ')[0] || 'there';
    const pitch = `Hi ${firstName},\n\nI noticed your recent requirement on LinkedIn regarding ${searchNiche} (${lead.postContent.slice(0, 80)}...).\n\nOur team specializes in delivering high-performance, custom ${searchNiche} solutions with fast turnaround times and proven ROI. We'd love to help you bring this project to life.\n\nWould you be open to a quick 5-minute chat or seeing a few relevant portfolio samples?\n\nBest regards,\n${profile?.name || 'LeadFlow Team'}`;
    setGeneratedPitch(pitch);
  };

  // --- IMPORT TO FOLDER WORKFLOW ---
  const handleOpenImportModal = async (targetLeads) => {
    const leads = Array.isArray(targetLeads) && targetLeads.length > 0 ? targetLeads : (qualifiedLeads.length > 0 ? qualifiedLeads : searchResults);
    if (leads.length === 0) {
      showError('No leads available to import to folder');
      return;
    }

    setLeadsToImport(leads);
    setFolderName(`LinkedIn Leads - ${searchNiche}`);
    setFolderDescription(`100% Real Live LinkedIn Leads for "${searchNiche}" (${targetLocation})`);
    setFolderColor('#4F46E5');
    setFolderMode('new');
    setIsFolderModalOpen(true);

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

  const handleConfirmImportToFolder = async (e) => {
    e.preventDefault();
    if (folderMode === 'new' && !folderName.trim()) {
      showError('Please enter a folder name');
      return;
    }
    if (folderMode === 'existing' && !selectedFolderId) {
      showError('Please select a folder');
      return;
    }

    try {
      setImportingToFolder(true);
      let targetFolderId = selectedFolderId;
      let finalFolderName = folderName.trim();

      // 1. Create folder if in new mode
      if (folderMode === 'new') {
        const createRes = await api.post('/folders', {
          name: folderName.trim(),
          description: folderDescription.trim(),
          color: folderColor
        });

        if (createRes.data?.success && createRes.data.folder?._id) {
          targetFolderId = createRes.data.folder._id;
          finalFolderName = createRes.data.folder.name;
        } else {
          showError('Failed to create folder');
          setImportingToFolder(false);
          return;
        }
      }

      // 2. Prepare headers with UPPERCASE enum types for Mongoose schema
      const headers = [
        { key: 'company', label: 'Company / Poster Name', type: 'TEXT' },
        { key: 'decisionMaker', label: 'Decision Maker / Role', type: 'TEXT' },
        { key: 'requirement', label: 'Requirement Post', type: 'TEXT' },
        { key: 'postUrl', label: 'LinkedIn Post URL', type: 'URL' },
        { key: 'location', label: 'Location', type: 'TEXT' },
        { key: 'urgency', label: 'Urgency', type: 'TEXT' },
        { key: 'status', label: 'Status', type: 'TEXT' }
      ];

      const rowsData = leadsToImport.map((l) => ({
        company: l.name || l.companyName || 'LinkedIn Lead',
        decisionMaker: l.decisionMaker || l.name || 'Hiring Lead',
        requirement: l.postContent || '',
        postUrl: l.postUrl || l.linkedinUrl || '',
        location: l.location || l.city || targetLocation || 'Global',
        urgency: l.intentBadge || 'Active Need',
        status: 'QUALIFIED'
      }));

      // 3. Import dataset into folder
      const importRes = await api.post(`/folders/${targetFolderId}/import`, {
        fileName: `LinkedIn_${searchNiche.replace(/\s+/g, '_')}_Leads`,
        headers,
        rowsData,
        duplicateMode: 'skip',
        duplicateKey: 'postUrl'
      });

      if (importRes.data?.success) {
        showSuccess(`📁 Successfully imported ${leadsToImport.length} LinkedIn leads into folder "${finalFolderName}"!`);
        setIsFolderModalOpen(false);
        if (openFolderAfter) {
          navigate(`${basePath}/folders/${targetFolderId}`);
        }
      } else {
        showError(importRes.data?.message || 'Failed to import dataset into folder');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Error importing leads to folder');
    } finally {
      setImportingToFolder(false);
    }
  };

  const filteredResults = searchResults.filter((item) => {
    if (intentFilter === 'ALL') return true;
    if (intentFilter === 'URGENT') return item.intentBadge?.includes('Urgent');
    if (intentFilter === 'HIRING') return item.intentBadge?.includes('Hiring');
    return true;
  });

  const currentTopLead = filteredResults[0];

  if (loading) {
    return (
      <div className="p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0077b5]" />
        <p className="text-xs font-bold text-slate-500">Checking LinkedIn connection status...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* CASE 1: USER NOT CONNECTED TO LINKEDIN -> SHOW EASY STEP-BY-STEP SETUP GUIDE */}
      {!isConnected && !bypassGate ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-crm-navy to-slate-950 text-white rounded-3xl p-8 shadow-2xl border border-sky-800/40 text-center space-y-4">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#0077b5]/30 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-3xl bg-[#0077b5] text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-[#0077b5]/40 mx-auto">
              in
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-black uppercase tracking-wider">
                Easy 4-Step LinkedIn Connection Guide
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Connect Your LinkedIn in 2 Minutes
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Follow these 4 simple steps to connect your LinkedIn account and unlock live leads.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setBypassGate(true);
                  handleSearchIntentPosts('Website Development');
                }}
                className="text-xs text-slate-400 hover:text-white underline font-semibold transition-colors"
              >
                ⚡ Skip setup & explore live leads preview
              </button>
            </div>
          </div>

          {/* 4-Step Visual Onboarding Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* STEP 1 */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0077b5] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    1
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Create Free LinkedIn App</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Go to LinkedIn Developer Portal and click <strong className="text-slate-900">"Create App"</strong>. Enter your App Name and LinkedIn Page URL.
                </p>
              </div>

              <a
                href="https://www.linkedin.com/developers/apps/new"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 bg-[#0077b5] hover:bg-[#006097] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <span>Open LinkedIn Developers ↗</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* STEP 2 */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0077b5] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Add Redirect URL</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In your app's <strong className="text-slate-900">Auth</strong> tab, click <strong>"Add redirect URL"</strong> under Authorized Redirect URLs and paste this:
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <code className="text-[11px] font-mono text-[#0077b5] font-bold truncate flex-1 pl-1">
                  {redirectUri}
                </code>
                <button
                  type="button"
                  onClick={handleCopyRedirectUri}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-black shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUri ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0077b5] text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Request "Sign In" Product</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  In your app's <strong className="text-slate-900">Products</strong> tab, find <strong className="text-[#0077b5]">"Sign In with LinkedIn using OpenID Connect"</strong> and click <strong>"Request Access"</strong> (instant approval).
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Takes 5 seconds & enables instant login</span>
              </div>
            </div>

            {/* STEP 4 */}
            <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500 ring-4 ring-emerald-500/10 shadow-xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    4
                  </div>
                  <h3 className="text-sm font-black text-slate-900">Paste Credentials & Connect</h3>
                </div>
                <p className="text-xs text-slate-600">
                  Copy your Client ID and Client Secret from the app's <strong>Auth</strong> tab:
                </p>
              </div>

              <form onSubmit={handleConnectOAuth} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">App Client ID <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="e.g. 78abc123def456"
                    className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0077b5]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Primary Client Secret <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="e.g. WXYZ1234abcd"
                      className="w-full py-2 pl-3 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0077b5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={connecting || !clientId.trim()}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Redirecting to LinkedIn...</span>
                    </>
                  ) : (
                    <>
                      <Linkedin className="w-4 h-4 text-white" />
                      <span>Authorize & Connect LinkedIn</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* CASE 2: USER IS CONNECTED (OR EXPLORING) -> SHOW FULL LEAD EXTRACTOR & SWIPE DECK */
        <div className="space-y-8">
          {/* Top Hero Banner with Connected Profile Badge */}
          <div className="relative overflow-hidden bg-gradient-to-br from-sky-950 via-crm-navy to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-sky-800/40">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-[#0077b5]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-3">
                  {profile?.picture ? (
                    <img src={profile.picture} alt={profile.name} className="w-12 h-12 rounded-2xl border-2 border-emerald-400 shadow-md object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-[#0077b5] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#0077b5]/30">
                      in
                    </div>
                  )}
                  <div>
                    {isConnected ? (
                      <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Connected: {profile?.name || 'LinkedIn Active'}</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Live Lead Explorer Preview</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-300 mt-0.5">{profile?.email || 'Extracting 100% Real Live Leads'}</p>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  LinkedIn Live Lead Qualifier & Swipe Deck
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Extract 100% real leads from LinkedIn posts and decision makers. <strong className="text-emerald-400">Swipe Right</strong> to Qualify, or <strong className="text-rose-400">Swipe Left</strong> to Dismiss!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenImportModal(qualifiedLeads.length > 0 ? qualifiedLeads : searchResults)}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <FolderPlus className="w-4 h-4 text-emerald-200" />
                  <span>Import to Folder</span>
                </button>

                {isConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBypassGate(false)}
                    className="px-4 py-3 bg-[#0077b5] hover:bg-[#006097] text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Connect Account</span>
                  </button>
                )}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Swipe Right &rarr; Qualify</p>
                  <p className="text-[11px] text-slate-300">Saves directly into Qualified leads</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Swipe Left &larr; Dismiss</p>
                  <p className="text-[11px] text-slate-300">Quickly skip unqualified posts</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-[#0077b5]/30 text-sky-300 flex items-center justify-center shrink-0">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">Import to Folder</p>
                  <p className="text-[11px] text-slate-300">Organize into custom campaign folders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Input Section */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0077b5]/10 text-[#0077b5] flex items-center justify-center font-bold">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Search & Extract Live LinkedIn Leads
                    </h2>
                    <p className="text-xs text-slate-500">
                      Type <strong className="text-slate-800">ANY keyword, service, or industry</strong> to find real live buyer posts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab & View Mode Toggles */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('QUEUE')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'QUEUE'
                      ? 'bg-crm-navy text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  <span>Queue ({searchResults.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('QUALIFIED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'QUALIFIED'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-200" />
                  <span>Qualified ({qualifiedLeads.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('DISMISSED')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    activeTab === 'DISMISSED'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  <X className="w-3.5 h-3.5 text-rose-300" />
                  <span>Dismissed ({dismissedLeads.length})</span>
                </button>
              </div>
            </div>

            {/* Search Query Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearchIntentPosts();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type ANY Keyword, Service, or Industry <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchNiche}
                      onChange={(e) => setSearchNiche(e.target.value)}
                      placeholder="e.g. Graphic Designer, Python Developer, Real Estate in Dubai, Dentist, Website..."
                      className="w-full py-3 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0077b5]"
                    />
                    {searchNiche && (
                      <button
                        type="button"
                        onClick={() => setSearchNiche('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Location</label>
                  <input
                    type="text"
                    value={targetLocation}
                    onChange={(e) => setTargetLocation(e.target.value)}
                    placeholder="e.g. Global, Dubai, London, USA"
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0077b5]"
                  />
                </div>

                <div className="sm:col-span-3 flex items-end">
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full py-3 px-4 bg-[#0077b5] hover:bg-[#006097] text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching LinkedIn...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 text-white" />
                        <span>Find Real Leads</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Idea Suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Quick Ideas:
                </span>
                {POPULAR_IDEAS.map((idea) => (
                  <button
                    type="button"
                    key={idea.label}
                    onClick={() => {
                      setSearchNiche(idea.label);
                      handleSearchIntentPosts(idea.label);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 border ${
                      searchNiche.toLowerCase() === idea.label.toLowerCase()
                        ? 'bg-[#0077b5] text-white border-[#0077b5]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span>{idea.icon}</span>
                    <span>{idea.label}</span>
                  </button>
                ))}
              </div>
            </form>

            {/* Search Results Display */}
            {searchError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* TAB 1: SWIPE QUEUE DECK */}
            {activeTab === 'QUEUE' && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Leads Queue ({filteredResults.length} remaining)
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      for <strong className="text-[#0077b5]">"{searchNiche}"</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setViewMode('SWIPE')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                          viewMode === 'SWIPE' ? 'bg-[#0077b5] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Swipe Deck</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('GRID')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                          viewMode === 'GRID' ? 'bg-[#0077b5] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Grid View</span>
                      </button>
                    </div>

                    {swipeHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleUndoSwipe}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty Queue State */}
                {filteredResults.length === 0 && !searching && (
                  <div className="py-16 text-center space-y-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-black">
                      ✓
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                      <h3 className="text-base font-black text-slate-900">Queue Complete!</h3>
                      <p className="text-xs text-slate-500">
                        You reviewed all extracted leads. You qualified <strong className="text-emerald-700">{qualifiedLeads.length} leads</strong>.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenImportModal(qualifiedLeads)}
                        disabled={qualifiedLeads.length === 0}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Import {qualifiedLeads.length} Qualified to Folder</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('QUALIFIED')}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
                      >
                        View Qualified ({qualifiedLeads.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* SWIPE DECK MODE */}
                {viewMode === 'SWIPE' && currentTopLead && (
                  <div className="flex flex-col items-center justify-center py-4 select-none">
                    {/* Keyboard tip */}
                    <p className="text-[11px] font-bold text-slate-400 mb-3 flex items-center gap-2">
                      <span>💡 Tip: Drag card left/right or use keyboard</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded border text-slate-600 font-mono">←</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded border text-slate-600 font-mono">→</span>
                    </p>

                    {/* The Interactive Swipable Card Container */}
                    <div className="relative w-full max-w-lg h-[460px] flex items-center justify-center">
                      {/* Next Card Behind (Stack Effect) */}
                      {filteredResults.length > 1 && (
                        <div className="absolute w-[94%] h-[420px] bg-slate-100 rounded-3xl border border-slate-300/80 shadow-xs transform translate-y-3 scale-95 opacity-60 pointer-events-none" />
                      )}

                      {/* Top Active Card */}
                      <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={(e) => handlePointerUp(e, currentTopLead)}
                        onPointerCancel={(e) => handlePointerUp(e, currentTopLead)}
                        style={{
                          touchAction: 'none',
                          userSelect: 'none',
                          transform: swipeAnimation === 'RIGHT'
                            ? 'translate3d(600px, 0, 0) rotate(25deg)'
                            : swipeAnimation === 'LEFT'
                            ? 'translate3d(-600px, 0, 0) rotate(-25deg)'
                            : `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.3}px, 0) rotate(${dragOffset.x * 0.07}deg)`,
                          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        className={`absolute w-full h-[440px] bg-white rounded-3xl p-6 border-2 shadow-xl cursor-grab active:cursor-grabbing flex flex-col justify-between overflow-hidden select-none transition-colors ${
                          dragOffset.x > 30
                            ? 'border-emerald-500 ring-4 ring-emerald-500/20'
                            : dragOffset.x < -30
                            ? 'border-rose-500 ring-4 ring-rose-500/20'
                            : 'border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        {/* Dynamic Swipe Badges / Stamps */}
                        {dragOffset.x > 25 && (
                          <div className="absolute top-6 right-6 px-4 py-1.5 border-2 border-emerald-600 bg-emerald-50 text-emerald-700 font-black text-sm uppercase rounded-xl tracking-wider transform rotate-12 shadow-md animate-in fade-in z-20">
                            SAVE & QUALIFY ✓
                          </div>
                        )}
                        {dragOffset.x < -25 && (
                          <div className="absolute top-6 left-6 px-4 py-1.5 border-2 border-rose-600 bg-rose-50 text-rose-700 font-black text-sm uppercase rounded-xl tracking-wider transform -rotate-12 shadow-md animate-in fade-in z-20">
                            DELETE / DISMISS ✕
                          </div>
                        )}

                        {/* Card Content Header */}
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#0077b5] to-sky-700 text-white font-black flex items-center justify-center text-xl shadow-md shrink-0">
                              {currentTopLead.name ? currentTopLead.name.charAt(0) : 'L'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-black text-slate-900 truncate">{currentTopLead.name}</h3>
                                <CheckCircle2 className="w-4 h-4 text-[#0077b5] shrink-0" />
                              </div>
                              <p className="text-xs font-bold text-slate-500 truncate">{currentTopLead.decisionMaker || currentTopLead.companyName}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span>{currentTopLead.city || targetLocation}</span>
                              </p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 shrink-0 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-600" />
                              {currentTopLead.intentBadge || 'Active Need'}
                            </span>
                          </div>

                          {/* Post Quote Box */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 max-h-[160px] overflow-y-auto">
                            <div className="flex items-center justify-between text-[11px] font-bold text-[#0077b5]">
                              <span className="flex items-center gap-1.5">
                                <MessageSquareQuote className="w-4 h-4" />
                                LinkedIn Requirement:
                              </span>
                              <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                100% Real Live Signal
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                              "{currentTopLead.postContent}"
                            </p>
                          </div>
                        </div>

                        {/* Bottom Links Row */}
                        <div className="space-y-3 pt-3 border-t border-slate-100">
                          <div className="grid grid-cols-3 gap-2">
                            {currentTopLead.postUrl && (
                              <a
                                href={currentTopLead.postUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2 px-2 bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                                <span>View Post</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenImportModal([currentTopLead])}
                              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>To Folder</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGeneratePitch(currentTopLead)}
                              className="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              <span>AI Pitch</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Big Action Buttons (Swipe Left & Swipe Right) */}
                    <div className="flex items-center gap-6 mt-6">
                      {/* Dismiss Button (Swipe Left) */}
                      <button
                        type="button"
                        onClick={() => handleDismissLead(currentTopLead)}
                        className="w-16 h-16 rounded-full bg-white hover:bg-rose-50 text-rose-600 border-2 border-rose-200 hover:border-rose-400 shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
                        title="Dismiss (Swipe Left)"
                      >
                        <X className="w-8 h-8 stroke-[2.5] group-hover:scale-110 transition-transform" />
                      </button>

                      {/* AI Pitch Helper Shortcut */}
                      <button
                        type="button"
                        onClick={() => handleGeneratePitch(currentTopLead)}
                        className="w-12 h-12 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-md flex items-center justify-center transition-all transform hover:scale-105"
                        title="AI Pitch Helper"
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>

                      {/* Qualify Button (Swipe Right) */}
                      <button
                        type="button"
                        onClick={() => handleQualifyLead(currentTopLead)}
                        className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 hover:shadow-xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 group"
                        title="Qualify & Save (Swipe Right)"
                      >
                        <Check className="w-8 h-8 stroke-[3] group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                )}

                {/* GRID VIEW MODE */}
                {viewMode === 'GRID' && filteredResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredResults.map((lead, idx) => (
                      <div
                        key={lead.id || idx}
                        className="bg-white hover:bg-sky-50/20 p-5 rounded-3xl border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0077b5] to-sky-700 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
                                {lead.name ? lead.name.charAt(0) : 'L'}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-sm font-black text-slate-900">{lead.name}</h3>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0077b5]" />
                                </div>
                                <p className="text-xs font-semibold text-slate-500 line-clamp-1">{lead.decisionMaker || lead.companyName}</p>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 shrink-0 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-600" />
                              {lead.intentBadge || 'Active Need'}
                            </span>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
                            <p className="text-xs text-slate-800 font-medium leading-relaxed italic line-clamp-4">
                              "{lead.postContent}"
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <div className="grid grid-cols-3 gap-2">
                            {lead.postUrl && (
                              <a
                                href={lead.postUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="py-2 px-2 bg-[#0077b5] hover:bg-[#006097] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 shadow-xs"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                                <span>Post</span>
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenImportModal([lead])}
                              className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Folder</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGeneratePitch(lead)}
                              className="py-2 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              <span>Pitch</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDismissLead(lead)}
                              className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Swipe Left (Delete)</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQualifyLead(lead)}
                              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Swipe Right (Save)</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: QUALIFIED LEADS LIST */}
            {activeTab === 'QUALIFIED' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-5 h-5 text-emerald-700" />
                    <div>
                      <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        Qualified Leads ({qualifiedLeads.length})
                      </h3>
                      <p className="text-[11px] text-emerald-800">
                        These leads were swiped right and ready to be imported into any folder.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenImportModal(qualifiedLeads)}
                      disabled={qualifiedLeads.length === 0}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <FolderPlus className="w-4 h-4 text-emerald-200" />
                      <span>Import to Folder</span>
                    </button>
                  </div>
                </div>

                {qualifiedLeads.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-slate-200">
                    No qualified leads yet. Go back to Queue and Swipe Right on leads to add them here!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {qualifiedLeads.map((lead, idx) => (
                      <div key={lead.id || idx} className="bg-white p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{lead.name}</h4>
                            <p className="text-xs text-slate-500 font-bold">{lead.decisionMaker || lead.companyName}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            QUALIFIED ✓
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
                          "{lead.postContent}"
                        </p>

                        <div className="flex items-center gap-2 pt-1">
                          {lead.postUrl && (
                            <a
                              href={lead.postUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 px-3 bg-[#0077b5] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Linkedin className="w-3.5 h-3.5" />
                              <span>View Post</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenImportModal([lead])}
                            className="py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>To Folder</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGeneratePitch(lead)}
                            className="py-1.5 px-3 bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold rounded-xl"
                          >
                            AI Pitch
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: DISMISSED LEADS LIST */}
            {activeTab === 'DISMISSED' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between bg-rose-50 p-4 rounded-2xl border border-rose-200">
                  <div className="flex items-center gap-2.5">
                    <X className="w-5 h-5 text-rose-700" />
                    <div>
                      <h3 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                        Dismissed Leads ({dismissedLeads.length})
                      </h3>
                      <p className="text-[11px] text-rose-800">
                        Leads you swiped left. You can restore any lead back to the queue anytime.
                      </p>
                    </div>
                  </div>
                </div>

                {dismissedLeads.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-slate-200">
                    No dismissed leads.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dismissedLeads.map((lead, idx) => (
                      <div key={lead.id || idx} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 opacity-80">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-black text-slate-900">{lead.name}</h4>
                            <p className="text-xs text-slate-500 font-bold">{lead.decisionMaker || lead.companyName}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDismissedLeads((prev) => prev.filter((_, i) => i !== idx));
                              setSearchResults((prev) => [lead, ...prev]);
                              showSuccess(`Restored "${lead.name}" to queue`);
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-lg border border-slate-300 flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl italic line-clamp-2">
                          "{lead.postContent}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Pitch Helper Drawer / Modal if opened */}
            {selectedLeadForPitch && (
              <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-3xl space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                      AI Outreach Pitch tailored for {selectedLeadForPitch.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadForPitch(null)}
                    className="text-xs text-purple-700 font-bold hover:underline"
                  >
                    Close
                  </button>
                </div>

                <textarea
                  rows={5}
                  value={generatedPitch}
                  onChange={(e) => setGeneratedPitch(e.target.value)}
                  className="w-full p-3.5 bg-white border border-purple-200 rounded-2xl text-xs font-sans text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Copy and send directly on LinkedIn or email!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPitch);
                      showSuccess('Pitch copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Pitch</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Import to Folder Modal */}
          <Modal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
            title="Import LinkedIn Leads to Folder"
            maxWidth="max-w-xl"
          >
            <form onSubmit={handleConfirmImportToFolder} className="space-y-5">
              {/* Header Info */}
              <div className="p-4 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy-light text-white rounded-2xl shadow-md border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight">
                      Importing {leadsToImport.length} LinkedIn Leads
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Save leads into a folder to organize and send bulk email/WhatsApp campaigns
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500 text-white font-black text-xs rounded-full shadow-xs">
                  {leadsToImport.length} Leads
                </span>
              </div>

              {/* Mode Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFolderMode('new')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    folderMode === 'new'
                      ? 'bg-white text-crm-navy shadow-sm'
                      : 'text-slate-600 hover:text-crm-navy'
                  }`}
                >
                  <FolderPlus className="w-4 h-4 text-emerald-600" />
                  <span>Create New Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFolderMode('existing')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                    folderMode === 'existing'
                      ? 'bg-white text-crm-navy shadow-sm'
                      : 'text-slate-600 hover:text-crm-navy'
                  }`}
                >
                  <Folder className="w-4 h-4 text-sky-600" />
                  <span>Add to Existing ({existingFolders.length})</span>
                </button>
              </div>

              {/* Mode: Create New Folder */}
              {folderMode === 'new' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Folder Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="e.g. LinkedIn - Website Development Clients"
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
                      placeholder="Notes about this lead batch..."
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
              {folderMode === 'existing' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {loadingFolders ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="w-6 h-6 border-2 border-crm-navy border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-500">Loading your folders...</p>
                    </div>
                  ) : existingFolders.length === 0 ? (
                    <div className="p-6 text-center bg-amber-50 border border-amber-200 rounded-2xl text-amber-800">
                      <p className="text-xs font-bold">No existing folders found.</p>
                      <button
                        type="button"
                        onClick={() => setFolderMode('new')}
                        className="mt-3 px-3.5 py-1.5 bg-amber-700 text-white text-xs font-black rounded-xl hover:bg-amber-800"
                      >
                        Create New Folder Instead
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
                        {existingFolders.map((f) => (
                          <option key={f._id} value={f._id}>
                            📁 {f.name} ({f.totalRecords || 0} existing records)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Automatic Navigation Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={openFolderAfter}
                  onChange={(e) => setOpenFolderAfter(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Open Folder Immediately After Import</span>
                  <span className="text-[11px] text-slate-500 block">
                    Takes you directly inside the folder to view records and launch outreach
                  </span>
                </div>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  disabled={importingToFolder}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={importingToFolder || (folderMode === 'existing' && !selectedFolderId)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                >
                  {importingToFolder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Importing Leads...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4" />
                      <span>{folderMode === 'new' ? 'Create Folder & Import' : 'Import to Folder'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default LinkedIn;
