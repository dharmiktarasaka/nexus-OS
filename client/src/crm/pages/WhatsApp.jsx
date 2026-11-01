import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Smartphone,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Phone,
  Power,
  ChevronRight,
  Eye,
  History,
  ShieldCheck,
  AlertTriangle,
  Play,
  FileText,
  X,
  Shuffle,
  Plus,
  Trash2,
  Copy,
  Image as ImageIcon,
  Paperclip,
  UploadCloud,
  FileImage,
  MessageSquare,
  ToggleLeft,
  ToggleRight,
  Save,
  User,
  Shield,
  Rocket,
  Zap,
  Check,
  Sliders
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { WhatsAppLiveTracker } from '../components/WhatsAppLiveTracker';

const PRESET_TEMPLATES = [
  {
    id: 'intro',
    name: 'Introduction & Welcome',
    text: `Hello {name},\n\nThank you for reaching out to us! We are excited to assist you with our premium solutions for {company}.\n\nPlease let us know what time works best for a quick conversation.\n\nBest regards,\nOur Sales Team`
  },
  {
    id: 'followup',
    name: 'Lead Follow-up',
    text: `Hi {name},\n\nJust following up on our previous discussion regarding your business requirements at {company}. Do you have 5 minutes this week for a brief catch-up?\n\nLooking forward to speaking with you!`
  },
  {
    id: 'offer',
    name: 'Special Promotion / Offer',
    text: `Exclusive Offer for {name} & {company}! 🎉\n\nWe are pleased to offer a special 20% discount on our entire service suite this month.\n\nReply to this message to claim your offer today.`
  },
  {
    id: 'meeting',
    name: 'Meeting Confirmation',
    text: `Hi {name},\n\nThis is a quick reminder regarding our scheduled meeting with {company}.\n\nIf you need to reschedule or have any questions beforehand, feel free to reply directly to this message.\n\nSee you soon!`
  }
];

export const WhatsApp = () => {
  const toast = useToast();
  const showToast = (msg, type = 'info') => {
    if (toast?.showToast) toast.showToast(msg, type);
    else if (toast?.addToast) toast.addToast(msg, type);
  };
  const [activeTab, setActiveTab] = useState('connect'); // 'connect' | 'bulk' | 'history'

  // Connection State
  const [connectionStatus, setConnectionStatus] = useState({
    status: 'DISCONNECTED', // DISCONNECTED, INITIALIZING, QR_READY, AUTHENTICATED, READY, AUTH_FAILURE
    loadingProgress: null,
    qrCodeData: null,
    userProfile: null,
    errorMessage: null,
    isConnected: false,
    connectedAt: null
  });
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Single Tester State
  const [singlePhone, setSinglePhone] = useState('');
  const [singleMessage, setSingleMessage] = useState('Hello! This is a test WhatsApp message from CRM.');
  const [sendingSingle, setSendingSingle] = useState(false);

  // Bulk State
  const [recipientSource, setRecipientSource] = useState('crm'); // 'crm' | 'manual'
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [leadSearch, setLeadSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  
  const [manualPhonesText, setManualPhonesText] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('');
  const [bulkTemplates, setBulkTemplates] = useState([
    `Hello {name},\n\nThank you for connecting with us regarding your interest in our services for {company}. Let us know if you have any questions!\n\nBest regards,\nCRM Team`,
    `Hi {name},\n\nHope all is well! Reaching out to see if you would like to explore our solutions for {company}. When is a good time to chat?\n\nBest,\nCRM Team`,
    `Greetings {name}!\n\nWe have special updates tailored for {company}. Reply to this WhatsApp message to get full details!\n\nRegards,\nCRM Team`
  ]);
  const [activeBulkTemplateIndex, setActiveBulkTemplateIndex] = useState(0);
  const [minDelaySeconds, setMinDelaySeconds] = useState(15.0);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(45.0);
  const [defaultCountryCode, setDefaultCountryCode] = useState('91');
  const [delayMs, setDelayMs] = useState(2500);

  // Anti-Ban Safety Pacing & Algorithmic Shield State
  const [speedPreset, setSpeedPreset] = useState('safe_human'); // 'ultra_safe' | 'safe_human' | 'balanced' | 'custom'
  const [strictHourlyLimit, setStrictHourlyLimit] = useState(true);
  const [hourlyLimit, setHourlyLimit] = useState(12);
  const [nonRepeatingDelays, setNonRepeatingDelays] = useState(true);
  const [typingSimulation, setTypingSimulation] = useState(true);
  const [batchSize, setBatchSize] = useState(15);
  const [batchCooldownSeconds, setBatchCooldownSeconds] = useState(45);
  const [spintaxEnabled, setSpintaxEnabled] = useState(true);
  const [paceAcrossHour, setPaceAcrossHour] = useState(true);
  const [previewSpintaxKey, setPreviewSpintaxKey] = useState(0);

  // Live Campaign Execution State
  const [currentCampaign, setCurrentCampaign] = useState(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [campaignPollInterval, setCampaignPollInterval] = useState(null);

  // Photo Attachment State (Bulk)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null); // base64 data URL
  const [photoFileName, setPhotoFileName] = useState('');
  const [photoMimeType, setPhotoMimeType] = useState('');
  const photoInputRef = useRef(null);

  // Photo Attachment State (Single Tester)
  const [singlePhotoFile, setSinglePhotoFile] = useState(null);
  const [singlePhotoPreview, setSinglePhotoPreview] = useState(null);
  const [singlePhotoFileName, setSinglePhotoFileName] = useState('');
  const [singlePhotoMimeType, setSinglePhotoMimeType] = useState('');
  const singlePhotoInputRef = useRef(null);

  // History State
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [selectedCampaignModal, setSelectedCampaignModal] = useState(null);

  // Auto-Reply Settings State
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [autoReplyText, setAutoReplyText] = useState("I'll get back to you as soon as possible!");
  const [savingAutoReply, setSavingAutoReply] = useState(false);

  const textareaRef = useRef(null);

  // Poll connection status
  const fetchStatus = async () => {
    try {
      const res = await api.get('/whatsapp/status');
      if (res.data?.success) {
        setConnectionStatus({
          status: res.data.status,
          loadingProgress: res.data.loadingProgress || null,
          qrCodeData: res.data.qrCodeData,
          userProfile: res.data.userProfile,
          errorMessage: res.data.errorMessage,
          isConnected: res.data.status === 'READY',
          connectedAt: res.data.connectedAt
        });
      }
    } catch (err) {
      // Quiet fail on network polling
    }
  };

  // Fetch auto-reply settings from the server
  const fetchAutoReplySettings = async () => {
    try {
      const res = await api.get('/whatsapp/auto-reply');
      if (res.data?.success) {
        if (typeof res.data.autoReplyEnabled === 'boolean') setAutoReplyEnabled(res.data.autoReplyEnabled);
        if (typeof res.data.autoReplyText === 'string' && res.data.autoReplyText.trim()) setAutoReplyText(res.data.autoReplyText);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  // Toggle auto-reply ON / OFF immediately and persist to server
  const handleToggleAutoReply = async () => {
    const nextState = !autoReplyEnabled;
    setAutoReplyEnabled(nextState);
    try {
      const res = await api.post('/whatsapp/auto-reply', {
        enabled: nextState,
        text: autoReplyText.trim()
      });
      if (res.data?.success) {
        showToast(`Auto-reply turned ${nextState ? 'ON' : 'OFF'}`, nextState ? 'success' : 'info');
      }
    } catch (err) {
      setAutoReplyEnabled(!nextState); // Revert on error
      showToast('Failed to update auto-reply status', 'error');
    }
  };

  // Save auto-reply settings to the server
  const handleSaveAutoReply = async () => {
    if (!autoReplyText.trim()) {
      showToast('Auto-reply message cannot be empty.', 'warning');
      return;
    }
    try {
      setSavingAutoReply(true);
      const res = await api.post('/whatsapp/auto-reply', {
        enabled: autoReplyEnabled,
        text: autoReplyText.trim()
      });
      if (res.data?.success) {
        showToast('Auto-reply settings saved successfully!', 'success');
      } else {
        showToast(res.data?.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save auto-reply settings', 'error');
    } finally {
      setSavingAutoReply(false);
    }
  };

  // Clear the 24h auto-reply cooldown cache so any number can be tested again immediately
  const handleClearCache = async () => {
    try {
      const res = await api.post('/whatsapp/clear-cache', {});
      if (res.data?.success) {
        showToast('Auto-reply cache cleared! All numbers can receive auto-reply again.', 'success');
      } else {
        showToast(res.data?.message || 'Failed to clear cache', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to clear cache', 'error');
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchAutoReplySettings();

    const onFocus = () => {
      fetchStatus();
    };
    window.addEventListener('focus', onFocus);

    // Ultra-fast polling (800ms) during transition states (INITIALIZING, QR_READY, AUTHENTICATED)
    // Slower polling (3500ms) when settled (READY or DISCONNECTED)
    const isTransitional =
      connectionStatus.status === 'INITIALIZING' ||
      connectionStatus.status === 'QR_READY' ||
      connectionStatus.status === 'AUTHENTICATED';
    const pollIntervalTime = isTransitional ? 800 : 3500;

    const interval = setInterval(() => {
      fetchStatus();
    }, pollIntervalTime);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [connectionStatus.status]);

  // Fetch leads for WhatsApp selection
  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const res = await api.get('/whatsapp/leads');
      if (res.data?.success) {
        setLeads(res.data.leads || []);
      }
    } catch (err) {
      showToast('Failed to load CRM leads', 'error');
    } finally {
      setLoadingLeads(false);
    }
  };

  // Fetch campaigns history
  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const res = await api.get('/whatsapp/campaigns');
      if (res.data?.success) {
        setCampaigns(res.data.campaigns || []);
      }
    } catch (err) {
      showToast('Failed to load campaigns history', 'error');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bulk') {
      fetchLeads();
    } else if (activeTab === 'history') {
      fetchCampaigns();
    }
  }, [activeTab]);

  // Connect / Request QR
  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await api.post('/whatsapp/connect');
      if (res.data?.success) {
        showToast(res.data.message || 'WhatsApp client initializing. QR code will appear.', 'info');
        fetchStatus();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start WhatsApp connection', 'error');
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to unlink and disconnect your WhatsApp session?')) {
      return;
    }
    try {
      setLoadingStatus(true);
      const res = await api.post('/whatsapp/disconnect');
      if (res.data?.success) {
        showToast('WhatsApp session unlinked successfully', 'success');
        fetchStatus();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to disconnect WhatsApp', 'error');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Photo Upload & Removal Handlers
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP, GIF)', 'warning');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image size should be less than 15MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoFile(file);
      setPhotoPreview(reader.result);
      setPhotoFileName(file.name);
      setPhotoMimeType(file.type || 'image/jpeg');
      showToast(`Photo "${file.name}" attached successfully!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoFileName('');
    setPhotoMimeType('');
    if (photoInputRef.current) photoInputRef.current.value = '';
    showToast('Attached photo removed', 'info');
  };

  const handleSinglePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSinglePhotoFile(file);
      setSinglePhotoPreview(reader.result);
      setSinglePhotoFileName(file.name);
      setSinglePhotoMimeType(file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSinglePhoto = () => {
    setSinglePhotoFile(null);
    setSinglePhotoPreview(null);
    setSinglePhotoFileName('');
    setSinglePhotoMimeType('');
    if (singlePhotoInputRef.current) singlePhotoInputRef.current.value = '';
  };

  // Single Message Test
  const handleSendSingle = async (e) => {
    e.preventDefault();
    if (!singlePhone.trim()) {
      showToast('Please enter a valid phone number', 'warning');
      return;
    }
    const hasText = Boolean(singleMessage && singleMessage.trim());
    const hasPhoto = Boolean(singlePhotoPreview);
    if (!hasText && !hasPhoto) {
      showToast('Please enter message text or attach a photo', 'warning');
      return;
    }
    try {
      setSendingSingle(true);
      const res = await api.post('/whatsapp/send-single', {
        phone: singlePhone,
        message: singleMessage.trim(),
        mediaBase64: singlePhotoPreview || '',
        mediaMimeType: singlePhotoMimeType || '',
        mediaFileName: singlePhotoFileName || '',
        defaultCountryCode
      });
      if (res.data?.success) {
        showToast('Real WhatsApp message sent successfully!', 'success');
        setSingleMessage('');
        handleRemoveSinglePhoto();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send WhatsApp message', 'error');
    } finally {
      setSendingSingle(false);
    }
  };

  // Lead selection helpers
  const filteredLeads = leads.filter(l => {
    const matchSearch =
      l.name?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.phone?.includes(leadSearch) ||
      l.companyName?.toLowerCase().includes(leadSearch.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSelectAllLeads = () => {
    if (selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds(new Set());
    } else {
      const allIds = new Set(filteredLeads.map(l => l._id));
      setSelectedLeadIds(allIds);
    }
  };

  const handleToggleLead = (id) => {
    const updated = new Set(selectedLeadIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedLeadIds(updated);
  };

  // Variable insertion into active draft template
  const handleInsertVariable = (tag) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = bulkTemplates[activeBulkTemplateIndex] || '';
    const updated = current.substring(0, start) + `{${tag}}` + current.substring(end);
    
    const newTemplates = [...bulkTemplates];
    newTemplates[activeBulkTemplateIndex] = updated;
    setBulkTemplates(newTemplates);

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 50);
  };

  // Launch Bulk Campaign
  const handleStartBulk = async () => {
    if (!connectionStatus.isConnected) {
      showToast('Please connect your WhatsApp via QR Code first.', 'warning');
      setActiveTab('connect');
      return;
    }

    const validTemplates = bulkTemplates.filter(t => t && t.trim());
    const hasPhoto = Boolean(photoPreview);

    if (validTemplates.length === 0 && !hasPhoto) {
      showToast('Please enter message text or attach a photo.', 'warning');
      return;
    }

    let payload = {
      title: campaignTitle.trim() || `Bulk WhatsApp Campaign - ${new Date().toLocaleDateString()}`,
      messageTemplate: validTemplates[0] || '',
      templates: validTemplates,
      mediaBase64: photoPreview || '',
      mediaMimeType: photoMimeType || '',
      mediaFileName: photoFileName || '',
      randomizeTemplates: true,
      speedPreset,
      strictHourlyLimit,
      hourlyLimit: Number(hourlyLimit) || 12,
      paceAcrossHour,
      nonRepeatingDelays,
      typingSimulation,
      minDelaySeconds: Number(minDelaySeconds) || 15.0,
      maxDelaySeconds: Number(maxDelaySeconds) || 45.0,
      batchSize: Number(batchSize) || 15,
      batchCooldownSeconds: Number(batchCooldownSeconds) || 45,
      spintaxEnabled,
      delayMs,
      defaultCountryCode
    };

    if (recipientSource === 'crm') {
      if (selectedLeadIds.size === 0) {
        showToast('Please select at least 1 lead from the list.', 'warning');
        return;
      }
      payload.leadIds = Array.from(selectedLeadIds);
    } else {
      const parsedNumbers = manualPhonesText
        .split(/[\n,]+/)
        .map(n => n.trim())
        .filter(n => n.length >= 7);
      if (parsedNumbers.length === 0) {
        showToast('Please paste or enter valid phone numbers (at least 1).', 'warning');
        return;
      }
      payload.recipients = parsedNumbers;
    }

    try {
      setSendingBulk(true);
      const res = await api.post('/whatsapp/send-bulk', payload);
      if (res.data?.success) {
        showToast('Bulk WhatsApp campaign launched with Anti-Ban Algorithmic Shield!', 'success');
        // Fetch detailed campaign progress
        const campaignId = res.data.campaignId;
        pollCampaignProgress(campaignId);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start bulk campaign', 'error');
      setSendingBulk(false);
    }
  };

  const pollCampaignProgress = (id) => {
    const check = async () => {
      try {
        const res = await api.get(`/whatsapp/campaigns/${id}`);
        if (res.data?.success && res.data.campaign) {
          setCurrentCampaign(res.data.campaign);
          if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(res.data.campaign.status)) {
            setSendingBulk(false);
            clearInterval(interval);
            showToast(`Campaign ${res.data.campaign.status.toLowerCase()}!`, 'success');
          }
        }
      } catch (e) {
        // Polling quiet
      }
    };
    check();
    const interval = setInterval(check, 2000);
    setCampaignPollInterval(interval);
  };

  // Cleanup poll interval on unmount
  useEffect(() => {
    return () => {
      if (campaignPollInterval) clearInterval(campaignPollInterval);
    };
  }, [campaignPollInterval]);

  // Cancel in-progress campaign
  const handleCancelCampaign = async () => {
    if (!currentCampaign?._id) return;
    try {
      await api.post(`/whatsapp/campaigns/${currentCampaign._id}/cancel`);
      showToast('Campaign cancellation requested', 'info');
    } catch (e) {
      showToast('Could not cancel campaign', 'error');
    }
  };

  // Anti-Ban Speed Preset Handler
  const applySpeedPreset = (presetKey) => {
    setSpeedPreset(presetKey);
    if (presetKey === 'ultra_safe') {
      setStrictHourlyLimit(true);
      setHourlyLimit(5);
      setPaceAcrossHour(true);
      setNonRepeatingDelays(true);
      setTypingSimulation(true);
      setMinDelaySeconds(500);
      setMaxDelaySeconds(950);
      setBatchSize(5);
      setBatchCooldownSeconds(120);
    } else if (presetKey === 'safe_human') {
      setStrictHourlyLimit(true);
      setHourlyLimit(15);
      setPaceAcrossHour(true);
      setNonRepeatingDelays(true);
      setTypingSimulation(true);
      setMinDelaySeconds(160);
      setMaxDelaySeconds(320);
      setBatchSize(10);
      setBatchCooldownSeconds(60);
    } else if (presetKey === 'balanced') {
      setStrictHourlyLimit(true);
      setHourlyLimit(30);
      setPaceAcrossHour(true);
      setNonRepeatingDelays(true);
      setTypingSimulation(true);
      setMinDelaySeconds(80);
      setMaxDelaySeconds(160);
      setBatchSize(15);
      setBatchCooldownSeconds(45);
    }
  };

  // Spintax syntax parser for preview
  const evaluateSpintax = (text) => {
    if (!text || typeof text !== 'string') return '';
    let result = text;
    const spintaxRegex = /\{([^{}]*\|[^{}]*)\}/;
    let iterations = 0;
    while (spintaxRegex.test(result) && iterations < 30) {
      iterations++;
      result = result.replace(spintaxRegex, (_, choices) => {
        const options = choices.split('|');
        return options[Math.floor(Math.random() * options.length)];
      });
    }
    return result;
  };

  // Dynamic Time Estimation
  const totalLoadedRecipients = recipientSource === 'crm'
    ? selectedLeadIds.size
    : manualPhonesText.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 7).length;

  const calculateEstimatedTime = () => {
    if (totalLoadedRecipients === 0) return '0 minutes';

    let totalSeconds = 0;
    if (paceAcrossHour && strictHourlyLimit && Number(hourlyLimit) > 0) {
      const avgIntervalSeconds = 3600 / Number(hourlyLimit);
      totalSeconds = Math.max(1, totalLoadedRecipients - 1) * avgIntervalSeconds;
    } else {
      const avgDelay = ((Number(minDelaySeconds) || 15) + (Number(maxDelaySeconds) || 45)) / 2;
      const typingDwell = typingSimulation ? 3 : 0;
      const basePacingSeconds = totalLoadedRecipients * (avgDelay + typingDwell);

      const batchesCount = Math.floor(totalLoadedRecipients / (Number(batchSize) || 15));
      const batchPauseSeconds = batchesCount * (Number(batchCooldownSeconds) || 45);

      totalSeconds = basePacingSeconds + batchPauseSeconds;

      if (strictHourlyLimit && Number(hourlyLimit) > 0) {
        const minSecondsForLimit = (totalLoadedRecipients / Number(hourlyLimit)) * 3600;
        if (minSecondsForLimit > totalSeconds) {
          totalSeconds = minSecondsForLimit;
        }
      }
    }

    const totalMinutes = Math.round(totalSeconds / 60);
    if (totalMinutes < 1) return 'Under 1 minute';
    if (totalMinutes < 60) return `${totalMinutes} minutes`;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins > 0 ? ` ${mins} min` : ''}`;
  };

  // Preview sample calculation
  const sampleLead = leads.find(l => selectedLeadIds.has(l._id)) || leads[0] || {
    name: 'Alex Johnson',
    companyName: 'Acme Solutions',
    phone: '+91 9876543210'
  };

  const rawPreviewMsg = (bulkTemplates[activeBulkTemplateIndex] || bulkTemplates[0] || '')
    .replace(/\{name\}/gi, sampleLead.name || 'Alex Johnson')
    .replace(/\{company\}/gi, sampleLead.companyName || 'Acme Solutions')
    .replace(/\{phone\}/gi, sampleLead.phone || '+91 9876543210')
    .replace(/\{date\}/gi, new Date().toLocaleDateString());

  const renderedPreview = spintaxEnabled ? evaluateSpintax(rawPreviewMsg) : rawPreviewMsg;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">WhatsApp Marketing Hub</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Live Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scan QR Code to link WhatsApp and deliver real bulk broadcasts directly to your CRM leads.
              </p>
            </div>
          </div>
        </div>

        {/* Live Status Pill & Quick Controls */}
        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 border shadow-sm transition-all ${
              connectionStatus.isConnected
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : connectionStatus.status === 'AUTHENTICATED'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/10 animate-pulse'
                : connectionStatus.status === 'QR_READY'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                : connectionStatus.status === 'INITIALIZING'
                ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                connectionStatus.isConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus.status === 'AUTHENTICATED'
                  ? 'bg-emerald-400 animate-ping'
                  : connectionStatus.status === 'QR_READY'
                  ? 'bg-amber-400 animate-ping'
                  : connectionStatus.status === 'INITIALIZING'
                  ? 'bg-blue-400 animate-spin'
                  : 'bg-rose-400'
              }`}
            />
            <span>
              {connectionStatus.isConnected
                ? `Connected: ${
                    connectionStatus.userProfile?.pushname
                      ? `${connectionStatus.userProfile.pushname} (${connectionStatus.userProfile.displayPhone || connectionStatus.userProfile.phone || ''})`
                      : connectionStatus.userProfile?.displayPhone || connectionStatus.userProfile?.phone || 'WhatsApp Active'
                  }`
                : connectionStatus.status === 'AUTHENTICATED'
                ? `QR Scanned! ${connectionStatus.loadingProgress?.message || 'Syncing WhatsApp...'}`
                : connectionStatus.status === 'QR_READY'
                ? 'Ready to Scan QR Code'
                : connectionStatus.status === 'INITIALIZING'
                ? 'Initializing Engine...'
                : 'WhatsApp Disconnected'}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchStatus}
            title="Refresh Status"
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 p-1.5 rounded-2xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('connect')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all ${
            activeTab === 'connect'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800/90 font-bold'
          }`}
        >
          <QrCode className={`w-4 h-4 ${activeTab === 'connect' ? 'text-slate-950' : 'text-emerald-600 dark:text-emerald-400'}`} />
          <span>Device Connection & QR</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all ${
            activeTab === 'bulk'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800/90 font-bold'
          }`}
        >
          <Send className={`w-4 h-4 ${activeTab === 'bulk' ? 'text-slate-950' : 'text-emerald-600 dark:text-emerald-400'}`} />
          <span>Send Bulk WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
              : 'text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/90 dark:hover:bg-slate-800/90 font-bold'
          }`}
        >
          <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-slate-950' : 'text-emerald-600 dark:text-emerald-400'}`} />
          <span>Broadcast History</span>
        </button>
      </div>

      {/* TAB 1: DEVICE CONNECTION & QR CODE */}
      {activeTab === 'connect' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code / Connection Card */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  Link WhatsApp Web Account
                </h2>
                <p className="text-xs text-slate-400">
                  Scan the dynamic QR code with your mobile WhatsApp to authorize real messaging.
                </p>
              </div>

              {connectionStatus.isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Unlink Account</span>
                </button>
              )}
            </div>

            {/* STATE 1: If Fully Connected (READY) */}
            {connectionStatus.isConnected ? (
              <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-5 animate-in fade-in shadow-xl">
                {/* Account Avatar & Status Badge */}
                <div className="flex flex-col items-center justify-center relative">
                  <div className="relative">
                    {connectionStatus.userProfile?.profilePicUrl ? (
                      <img
                        src={connectionStatus.userProfile.profilePicUrl}
                        alt="WhatsApp Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-emerald-400 shadow-lg shadow-emerald-500/20"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl border-2 border-emerald-400/60 shadow-lg shadow-emerald-500/20">
                        {connectionStatus.userProfile?.pushname
                          ? connectionStatus.userProfile.pushname.slice(0, 2).toUpperCase()
                          : 'WA'}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <h3 className="text-xl font-black text-white tracking-tight">
                        {connectionStatus.userProfile?.pushname || 'WhatsApp User'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        Online
                      </span>
                    </div>
                    <p className="text-xs text-emerald-400/90 font-medium">
                      Linked via WhatsApp Web Multi-Device
                    </p>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                  {/* WhatsApp Profile Name */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/25">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">WhatsApp Profile Name</p>
                      <p className="text-sm font-black text-white truncate" title={connectionStatus.userProfile?.pushname || 'WhatsApp User'}>
                        {connectionStatus.userProfile?.pushname || 'WhatsApp User'}
                      </p>
                    </div>
                  </div>

                  {/* Linked Phone Number */}
                  <div className="bg-slate-950/70 p-3.5 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/25">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">Linked Mobile Number</p>
                        <p className="text-sm font-black text-emerald-300 font-mono truncate" title={connectionStatus.userProfile?.displayPhone || connectionStatus.userProfile?.phone || 'Connected'}>
                          {connectionStatus.userProfile?.displayPhone || connectionStatus.userProfile?.phone || 'Connected'}
                        </p>
                      </div>
                    </div>
                    {connectionStatus.userProfile?.phone && connectionStatus.userProfile.phone !== 'Connected' && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(connectionStatus.userProfile.phone);
                          showToast('Phone number copied to clipboard!', 'success');
                        }}
                        title="Copy mobile number"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Auto-Reply Settings Card */}
                <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-4 max-w-md mx-auto text-left space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/25">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Auto-Reply to Unknown Numbers</p>
                        <p className="text-[10px] text-slate-400">Only for new messages from unsaved contacts</p>
                      </div>
                    </div>
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={handleToggleAutoReply}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        autoReplyEnabled
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                      title={autoReplyEnabled ? 'Click to disable' : 'Click to enable'}
                    >
                      {autoReplyEnabled ? (
                        <><ToggleRight className="w-4 h-4" /><span>ON</span></>
                      ) : (
                        <><ToggleLeft className="w-4 h-4" /><span>OFF</span></>
                      )}
                    </button>
                  </div>

                  {/* Status indicator line */}
                  {autoReplyEnabled ? (
                    <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active — will instantly reply to unknown numbers with the message below
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      Disabled — no automatic reply will be sent
                    </div>
                  )}

                  {/* Message textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Reply Message
                    </label>
                    <textarea
                      rows={3}
                      value={autoReplyText}
                      onChange={(e) => setAutoReplyText(e.target.value)}
                      disabled={!autoReplyEnabled}
                      placeholder="Type your auto-reply message..."
                      className={`w-full px-3 py-2 bg-slate-800/80 border rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none resize-none transition-all ${
                        autoReplyEnabled
                          ? 'border-slate-700 focus:border-emerald-500'
                          : 'border-slate-800 opacity-50 cursor-not-allowed'
                      }`}
                    />
                    <p className="text-[10px] text-slate-500">
                      Sent once per unknown number · 24h cooldown · Use <span className="text-amber-400 font-bold">Reset Cache</span> below to test again immediately.
                    </p>
                  </div>

                  {/* Action Buttons: Save + Reset Cache */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAutoReply}
                      disabled={savingAutoReply}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs transition-all"
                    >
                      {savingAutoReply ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></>
                      ) : (
                        <><Save className="w-3.5 h-3.5" /><span>Save Settings</span></>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      title="Clear 24h cooldown so you can test auto-reply again"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset Cache</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('bulk')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all"
                  >
                    <span>Proceed to Bulk Messaging</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : connectionStatus.status === 'AUTHENTICATED' ? (
              /* STATE 2: Scanned & Authenticating (Smooth Transition Screen - No Flicker) */
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-5 animate-in fade-in zoom-in-95">
                <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>QR Code Scanned Successfully!</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Authenticating WhatsApp Session...</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    WhatsApp Web is synchronizing your chats and establishing a secure connection. You will be connected automatically in just a moment.
                  </p>
                </div>

                {/* Animated Progress Bar */}
                <div className="max-w-md mx-auto space-y-2">
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700/60">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: connectionStatus.loadingProgress?.percent != null && connectionStatus.loadingProgress.percent > 0
                          ? `${Math.max(20, Math.min(100, connectionStatus.loadingProgress.percent))}%`
                          : '75%'
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {connectionStatus.loadingProgress?.message || 'Synchronizing with WhatsApp Web...'}
                    </span>
                    {connectionStatus.loadingProgress?.percent != null && (
                      <span className="font-bold text-slate-300">{connectionStatus.loadingProgress.percent}%</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl max-w-md mx-auto text-left flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong>Note:</strong> Please keep WhatsApp open on your phone while final synchronization completes. Do not refresh this page.
                  </p>
                </div>
              </div>
            ) : connectionStatus.status === 'QR_READY' && connectionStatus.qrCodeData ? (
              /* STATE 3: Ready to Scan QR Code */
              <div className="space-y-6 animate-in fade-in">
                <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl max-w-sm mx-auto shadow-2xl space-y-3">
                  <img
                    src={connectionStatus.qrCodeData}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 object-contain rounded-lg"
                  />
                  <div className="flex items-center gap-2 text-slate-800 text-xs font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Scan with WhatsApp on your phone</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${connecting ? 'animate-spin' : ''}`} />
                    <span>Regenerate QR Code</span>
                  </button>
                </div>

                {/* Scan Steps Instructions */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">How to Connect:</h4>
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                    <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                    <li>Tap <strong>Menu (Android)</strong> or <strong>Settings (iOS)</strong>.</li>
                    <li>Tap <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>.</li>
                    <li>Point your phone camera at the QR code above.</li>
                  </ol>
                </div>
              </div>
            ) : (
              /* STATE 4: Disconnected or Initializing State */
              <div className="space-y-6 animate-in fade-in">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mx-auto border border-white/10">
                    <QrCode className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">No Active WhatsApp Session</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Click the button below to generate a real-time QR code and pair your WhatsApp account with CRM.
                    </p>
                  </div>

                  {connectionStatus.status === 'INITIALIZING' ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold animate-pulse">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Starting WhatsApp Engine & Generating QR Code... (Takes ~5-10s)</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={connecting}
                        className="text-xs text-slate-400 hover:text-white underline transition-colors"
                      >
                        Taking too long? Force Retry
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={connecting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Generate WhatsApp QR Code</span>
                    </button>
                  )}

                  {connectionStatus.errorMessage && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2 max-w-md mx-auto">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="truncate">{connectionStatus.errorMessage}</span>
                    </div>
                  )}
                </div>

                {/* Scan Steps Instructions */}
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">How to Connect:</h4>
                  <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                    <li>Open <strong>WhatsApp</strong> on your mobile phone.</li>
                    <li>Tap <strong>Menu (Android)</strong> or <strong>Settings (iOS)</strong>.</li>
                    <li>Tap <strong>Linked Devices</strong> &rarr; <strong>Link a Device</strong>.</li>
                    <li>Point your phone camera at the QR code once generated.</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Single Message Tester & Anti-Ban Info */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Single Message Direct Tester */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  Quick Direct Message Test
                </h3>
                <p className="text-[11px] text-slate-400">
                  Send a live single WhatsApp message to verify connection.
                </p>
                {connectionStatus.isConnected && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="text-slate-300 text-[11px] truncate">
                      Sender:{' '}
                      <strong className="text-white">
                        {connectionStatus.userProfile?.pushname || 'WhatsApp User'}
                      </strong>{' '}
                      <span className="text-emerald-400 font-mono">
                        ({connectionStatus.userProfile?.displayPhone || connectionStatus.userProfile?.phone || ''})
                      </span>
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendSingle} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Recipient Phone Number
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-300 flex items-center">
                      +{defaultCountryCode}
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={singlePhone}
                      onChange={(e) => setSinglePhone(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Message Content (Optional if Photo Attached)
                  </label>
                  <textarea
                    rows={3}
                    value={singleMessage}
                    onChange={(e) => setSingleMessage(e.target.value)}
                    placeholder="Type your WhatsApp message..."
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Single Message Photo Attachment (Optional) */}
                <div className="space-y-1.5">
                  <input
                    type="file"
                    ref={singlePhotoInputRef}
                    onChange={handleSinglePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  {singlePhotoPreview ? (
                    <div className="p-2.5 bg-slate-800/90 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={singlePhotoPreview}
                          alt="Single Attachment"
                          className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{singlePhotoFileName || 'Attached Photo'}</p>
                          <span className="text-[10px] text-emerald-400 font-medium">Ready to send with message</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveSinglePhoto}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors shrink-0"
                        title="Remove attached photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => singlePhotoInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700/80 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-medium text-slate-300 transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4 text-emerald-400" />
                      <span>Attach Photo to Single Test (Optional)</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={sendingSingle || !connectionStatus.isConnected}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all disabled:opacity-40"
                >
                  {sendingSingle ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Real Message...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Direct Test Message</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Anti-Ban & Best Practices Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Anti-Ban & Safety Engine
              </h3>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span><strong>Automatic Random Jitter:</strong> Messages are sent with safe 2-4s randomized pauses to emulate natural typing.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span><strong>Dynamic Placeholders:</strong> Personalized greetings (`&#123;name&#125;`, `&#123;company&#125;`) make each message unique.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span><strong>Session Persistence:</strong> Scanned session stays safely saved without requiring rescans on browser reload.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BULK WHATSAPP SENDER */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Live WhatsApp Campaign Tracker with Countdown Timer & Recipient Queue */}
          <WhatsAppLiveTracker onRefresh={fetchCampaigns} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Recipient Selector */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-400" />
                  1. Choose Recipients Audience
                </h2>
                <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRecipientSource('crm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      recipientSource === 'crm' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    CRM Leads
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipientSource('manual')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      recipientSource === 'manual' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Paste Numbers
                  </button>
                </div>
              </div>

              {recipientSource === 'crm' ? (
                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search leads by name, phone or company..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">All Status</option>
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="QUALIFIED">Qualified</option>
                      <option value="WON">Won</option>
                    </select>
                  </div>

                  {/* Header Row with Select All */}
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-xl border border-white/5 text-xs text-slate-300">
                    <button
                      type="button"
                      onClick={handleSelectAllLeads}
                      className="flex items-center gap-2 font-bold hover:text-emerald-400 transition-colors"
                    >
                      {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>Select All Filtered ({filteredLeads.length})</span>
                    </button>
                    <span className="font-bold text-emerald-400">
                      {selectedLeadIds.size} Selected
                    </span>
                  </div>

                  {/* Leads List */}
                  <div className="flex-1 overflow-y-auto max-h-96 space-y-1.5 pr-1">
                    {loadingLeads ? (
                      <div className="text-center py-8 text-xs text-slate-400">Loading leads...</div>
                    ) : filteredLeads.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">No leads found with phone numbers</div>
                    ) : (
                      filteredLeads.map((lead) => {
                        const isSelected = selectedLeadIds.has(lead._id);
                        return (
                          <div
                            key={lead._id}
                            onClick={() => handleToggleLead(lead._id)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{lead.name || 'Unnamed Lead'}</p>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {lead.companyName ? `${lead.companyName} • ` : ''}
                                  {lead.phone}
                                </p>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-700 text-slate-300 shrink-0">
                              {lead.status || 'LEAD'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Manual Numbers Entry */
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Paste WhatsApp Numbers (One per line or comma-separated)
                    </label>
                    <textarea
                      rows={10}
                      value={manualPhonesText}
                      onChange={(e) => setManualPhonesText(e.target.value)}
                      placeholder="9876543210&#10;9123456780&#10;9988776655"
                      className="w-full p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>
                      Detected:{' '}
                      <strong className="text-emerald-400">
                        {
                          manualPhonesText
                            .split(/[\n,]+/)
                            .map(n => n.trim())
                            .filter(n => n.length >= 7).length
                        }
                      </strong>{' '}
                      valid numbers
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Message Composer & Live Preview */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Shuffle className="w-5 h-5 text-emerald-400" />
                      2. Compose Message Drafts (Random Rotation)
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      The system picks a random draft for each recipient (e.g. 1 &rarr; 4 &rarr; 2 &rarr; 5 &rarr; 1...) to bypass repetitive spam detection.
                    </p>
                    {connectionStatus.isConnected && (
                      <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Broadcasting from: <strong className="text-white">{connectionStatus.userProfile?.pushname || 'WhatsApp User'}</strong> ({connectionStatus.userProfile?.displayPhone || connectionStatus.userProfile?.phone || ''})
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newTemplates = [...bulkTemplates, bulkTemplates[activeBulkTemplateIndex] || ''];
                        setBulkTemplates(newTemplates);
                        setActiveBulkTemplateIndex(newTemplates.length - 1);
                        showToast('Draft variation duplicated!', 'info');
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      title="Duplicate current draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newTemplates = [
                          ...bulkTemplates,
                          `Hello {name},\n\nWe have exciting updates tailored for {company}. Please let us know if you would like more details!\n\nBest regards,\nCRM Team`
                        ];
                        setBulkTemplates(newTemplates);
                        setActiveBulkTemplateIndex(newTemplates.length - 1);
                      }}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Draft</span>
                    </button>
                  </div>
                </div>

                {/* Draft Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {bulkTemplates.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveBulkTemplateIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 text-xs font-bold shrink-0 transition-all border ${
                        activeBulkTemplateIndex === idx
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black shadow-xs'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Draft #{idx + 1}</span>
                      {bulkTemplates.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const filtered = bulkTemplates.filter((_, i) => i !== idx);
                            setBulkTemplates(filtered);
                            setActiveBulkTemplateIndex(Math.max(0, activeBulkTemplateIndex >= filtered.length ? filtered.length - 1 : activeBulkTemplateIndex));
                          }}
                          className="p-0.5 hover:bg-rose-500/30 rounded text-inherit transition-colors"
                          title="Delete draft"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Campaign Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Campaign Broadcast Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. October Lead Promotion Broadcast"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Dynamic Variables Chips */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Insert Tags into Draft #{activeBulkTemplateIndex + 1}:
                    </label>

                    {/* Template Preset Loader */}
                    <select
                      onChange={(e) => {
                        const found = PRESET_TEMPLATES.find(t => t.id === e.target.value);
                        if (found) {
                          const newTemplates = [...bulkTemplates];
                          newTemplates[activeBulkTemplateIndex] = found.text;
                          setBulkTemplates(newTemplates);
                        }
                      }}
                      defaultValue=""
                      className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-white focus:outline-none"
                    >
                      <option value="" disabled>Load preset into Draft #{activeBulkTemplateIndex + 1}...</option>
                      {PRESET_TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['name', 'company', 'phone', 'date'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertVariable(tag)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>&#123;{tag}&#125;</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (!textareaRef.current) return;
                        const start = textareaRef.current.selectionStart;
                        const end = textareaRef.current.selectionEnd;
                        const current = bulkTemplates[activeBulkTemplateIndex] || '';
                        const spintaxSample = '{Hello|Hi|Greetings}';
                        const updated = current.substring(0, start) + spintaxSample + current.substring(end);
                        const newTemplates = [...bulkTemplates];
                        newTemplates[activeBulkTemplateIndex] = updated;
                        setBulkTemplates(newTemplates);
                        showToast('Spintax rotation inserted! Each recipient receives a different word.', 'info');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
                      title="Insert Spintax variation: rotates words randomly per message"
                    >
                      <Shuffle className="w-3 h-3 text-teal-400" />
                      <span>&#123;Hello|Hi|Hey&#125; (Spintax)</span>
                    </button>
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                    <span>Message Body (Draft #{activeBulkTemplateIndex + 1})</span>
                    <span>{(bulkTemplates[activeBulkTemplateIndex] || '').length} chars</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={5}
                    value={bulkTemplates[activeBulkTemplateIndex] || ''}
                    onChange={(e) => {
                      const newTemplates = [...bulkTemplates];
                      newTemplates[activeBulkTemplateIndex] = e.target.value;
                      setBulkTemplates(newTemplates);
                    }}
                    className="w-full p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>Formatting supported: *bold*, _italic_, ~strikethrough~</span>
                  </div>
                </div>

                {/* 3. Attach Photo / Image / Flyer (Optional) */}
                <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-2">
                          Attach Photo / Flyer / Media
                          <span className="text-[10px] font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Optional
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          Send <strong>Photo + Text (as Caption)</strong>, <strong>Photo Only</strong>, or <strong>Text Only</strong>.
                        </p>
                      </div>
                    </div>

                    {photoPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-[11px] font-bold transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Photo</span>
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {photoPreview ? (
                    <div className="p-3 bg-slate-900/90 border border-emerald-500/40 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative group shrink-0">
                        <img
                          src={photoPreview}
                          alt="Attached Bulk Preview"
                          className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-xl border border-emerald-500/30 shadow-md"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-all"
                          title="Remove photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <p className="text-xs font-bold text-white truncate max-w-xs">{photoFileName || 'attached_photo.jpg'}</p>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {photoMimeType || 'image/jpeg'}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-400 font-medium">
                          ✓ Photo ready to broadcast. Draft message text will be delivered as the image caption.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl p-5 text-center cursor-pointer transition-all group space-y-2"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400 flex items-center justify-center mx-auto transition-colors border border-white/5">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                          Click to select or drag & drop image/photo
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Supports JPG, PNG, WEBP, GIF (Up to 15MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Smartphone Chat Preview */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      Live Preview (Rendering Draft #{activeBulkTemplateIndex + 1})
                    </span>

                    <div className="flex items-center gap-1">
                      {bulkTemplates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const rand = Math.floor(Math.random() * bulkTemplates.length);
                            setActiveBulkTemplateIndex(rand);
                            setPreviewSpintaxKey(k => k + 1);
                          }}
                          className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                          title="Pick random draft template"
                        >
                          <Shuffle className="w-3 h-3" />
                          <span>Draft 🎲</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewSpintaxKey(k => k + 1)}
                        className="px-2 py-0.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                        title="Spin words in {A|B|C}"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Re-spin 🔄</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 space-y-2 max-w-md">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        {sampleLead.name ? sampleLead.name.charAt(0) : 'L'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{sampleLead.name || 'Sample Lead'}</p>
                        <p className="text-[10px] text-slate-400">{sampleLead.phone || '+91 9876543210'}</p>
                      </div>
                    </div>
                    <div className="bg-[#005c4b] text-[#e9edef] p-2.5 rounded-2xl rounded-tr-xs text-xs leading-relaxed shadow-sm space-y-2">
                      {photoPreview && (
                        <div className="overflow-hidden rounded-xl">
                          <img
                            src={photoPreview}
                            alt="Live Message Attachment"
                            className="w-full max-h-56 object-cover rounded-xl shadow-xs"
                          />
                        </div>
                      )}
                      {renderedPreview ? (
                        <p className="px-1 text-xs whitespace-pre-wrap leading-relaxed" key={previewSpintaxKey}>
                          {renderedPreview}
                        </p>
                      ) : !photoPreview ? (
                        <p className="px-1 text-xs italic text-slate-400">Empty message...</p>
                      ) : null}
                      <div className="text-[9px] text-[#8696a0] text-right mt-1 px-1">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: ANTI-BAN PACING & LAUNCH (MATCHING SCREENSHOT) */}
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Step 4: Anti-Ban Pacing & Launch</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Configure safety pacing and trigger your campaign
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT CARD: Anti-Ban Pacing & Rate Limits */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Anti-Ban Pacing & Rate Limits</span>
                  </h3>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Algorithmic Shield
                  </span>
                </div>

                {/* ANTI-DETECTION SPEED PRESETS */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    ANTI-DETECTION SPEED PRESETS:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Preset 1: Ultra-Safe (Zero-Ban Shield) */}
                    <div
                      onClick={() => applySpeedPreset('ultra_safe')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                        speedPreset === 'ultra_safe'
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Zero-Ban Shield
                        </span>
                        <h4 className="text-xs font-bold text-white">Ultra-Safe (5 msgs/hr)</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Max 5 msgs/hr • ~12m intervals • Whole-hour paced
                        </p>
                      </div>
                    </div>

                    {/* Preset 2: Safe Human (Recommended) */}
                    <div
                      onClick={() => applySpeedPreset('safe_human')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                        speedPreset === 'safe_human'
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Recommended
                        </span>
                        <h4 className="text-xs font-bold text-white">Safe Human (15 msgs/hr)</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Max 15 msgs/hr • ~4m intervals • Whole-hour paced
                        </p>
                      </div>
                    </div>

                    {/* Preset 3: Balanced (Optimal Speed) */}
                    <div
                      onClick={() => applySpeedPreset('balanced')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-left relative ${
                        speedPreset === 'balanced'
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-800/50 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Optimal Speed
                        </span>
                        <h4 className="text-xs font-bold text-white">Balanced (30 msgs/hr)</h4>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          Max 30 msgs/hr • ~2m intervals • Whole-hour paced
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ANTI-DETECTION FEATURES */}
                <div className="space-y-4 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Anti-Detection Features</span>
                  </h4>

                  {/* Feature 1: Strict Hourly Limit */}
                  <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={strictHourlyLimit}
                          onChange={(e) => {
                            setStrictHourlyLimit(e.target.checked);
                            setSpeedPreset('custom');
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                        />
                        <span>Strict Hourly Limit (Max Messages / Hour):</span>
                      </label>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        {hourlyLimit} msg/hr
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={hourlyLimit}
                        disabled={!strictHourlyLimit}
                        onChange={(e) => {
                          setHourlyLimit(Number(e.target.value));
                          setSpeedPreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Limits total outbound messages to {hourlyLimit} per 60–minute rolling window to evade WhatsApp velocity triggers.
                    </p>
                  </div>

                  {/* Feature 2: Whole-Hour Smooth Randomized Pacing */}
                  <div className="space-y-1.5 bg-emerald-950/25 p-3.5 rounded-xl border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-200 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={paceAcrossHour}
                          disabled={!strictHourlyLimit}
                          onChange={(e) => {
                            setPaceAcrossHour(e.target.checked);
                            setSpeedPreset('custom');
                          }}
                          className="w-4 h-4 rounded border-emerald-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                        />
                        <span>Evenly Distribute Across Whole Hour</span>
                      </label>
                      <span className="text-[11px] font-bold text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded-full border border-emerald-700/50 font-mono">
                        ~{Math.max(1, Math.round(60 / (Number(hourlyLimit) || 12)))}m / msg
                      </span>
                    </div>
                    <p className="text-[10px] text-emerald-300/80 pl-6 leading-relaxed">
                      Spreads messages evenly across the full 60 minutes with random intervals so sending is active throughout the entire hour (prevents sending all in 5 mins and freezing).
                    </p>
                  </div>

                  {/* Feature 3: High-Variance Non-Repeating Delays */}
                  <div className="space-y-1 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={nonRepeatingDelays}
                          onChange={(e) => {
                            setNonRepeatingDelays(e.target.checked);
                            setSpeedPreset('custom');
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                        />
                        <span>High-Variance Non-Repeating Delays</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-6">
                      Intervals are randomly generated with unique jitter so timing never repeats.
                    </p>
                  </div>

                  {/* Feature 4: Human Typing Presence Simulation */}
                  <div className="space-y-1 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={typingSimulation}
                          onChange={(e) => {
                            setTypingSimulation(e.target.checked);
                            setSpeedPreset('custom');
                          }}
                          className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500"
                        />
                        <span>Human Typing Presence Simulation</span>
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 pl-6">
                      Sends WhatsApp "typing..." presence for 2–4s before sending each message.
                    </p>
                  </div>

                  {/* 4 Fine-tuning Sliders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Min Delay */}
                    <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Min Delay:</span>
                        <span className="text-emerald-400 font-mono">
                          {minDelaySeconds >= 60 ? `${minDelaySeconds}s (${(minDelaySeconds / 60).toFixed(1)}m)` : `${minDelaySeconds}s`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="600"
                        value={minDelaySeconds}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMinDelaySeconds(val);
                          if (val > maxDelaySeconds) setMaxDelaySeconds(val + 5);
                          setSpeedPreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Max Delay */}
                    <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Max Delay:</span>
                        <span className="text-emerald-400 font-mono">
                          {maxDelaySeconds >= 60 ? `${maxDelaySeconds}s (${(maxDelaySeconds / 60).toFixed(1)}m)` : `${maxDelaySeconds}s`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="1200"
                        value={maxDelaySeconds}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setMaxDelaySeconds(Math.max(val, minDelaySeconds));
                          setSpeedPreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Batch Size */}
                    <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Batch Size:</span>
                        <span className="text-emerald-400 font-mono">{batchSize} msgs</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="50"
                        value={batchSize}
                        onChange={(e) => {
                          setBatchSize(Number(e.target.value));
                          setSpeedPreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>

                    {/* Batch Cooldown Pause */}
                    <div className="space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300">Batch Cooldown Pause:</span>
                        <span className="text-emerald-400 font-mono">{batchCooldownSeconds}s</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        value={batchCooldownSeconds}
                        onChange={(e) => {
                          setBatchCooldownSeconds(Number(e.target.value));
                          setSpeedPreset('custom');
                        }}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: Pre-Flight Checklist */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-emerald-400" />
                    <span>Pre-Flight Checklist</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    Step 4 of 5
                  </span>
                </div>

                {/* Campaign Name / Identifier */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Campaign Name / Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. dental Ahmedabad"
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Checklist items */}
                <div className="space-y-2.5 text-xs">
                  {/* WhatsApp Account */}
                  <div className="flex items-center gap-2.5">
                    {connectionStatus.isConnected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-slate-300">
                      WhatsApp Account:{' '}
                      <strong className={connectionStatus.isConnected ? 'text-white' : 'text-rose-400'}>
                        {connectionStatus.isConnected
                          ? `${connectionStatus.userProfile?.pushname || 'Connected'} (${connectionStatus.userProfile?.displayPhone || connectionStatus.userProfile?.phone || 'Online'})`
                          : 'Not Connected'}
                      </strong>
                    </span>
                  </div>

                  {/* Recipients Loaded */}
                  <div className="flex items-center gap-2.5">
                    {totalLoadedRecipients > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-slate-300">
                      Recipients Loaded:{' '}
                      <strong className={totalLoadedRecipients > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {totalLoadedRecipients} contacts
                      </strong>
                    </span>
                  </div>

                  {/* Template Variations (Spintax enabled) */}
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">
                      Template Variations:{' '}
                      <strong className="text-white">
                        {bulkTemplates.filter(t => t && t.trim()).length} active
                      </strong>{' '}
                      <span className="text-emerald-400 font-semibold">(Spintax enabled)</span>
                    </span>
                  </div>

                  {/* Estimated Total Time */}
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">
                      Estimated Total Time:{' '}
                      <strong className="text-white">{calculateEstimatedTime()}</strong>
                    </span>
                  </div>
                </div>

                {/* Anti-Algorithm Protection Configured Box */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Anti-Algorithm Protection Configured:</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1 pl-6 list-disc">
                    <li>Pacing: Max <strong className="text-white">{hourlyLimit} messages per hour</strong> {paceAcrossHour ? <span className="text-emerald-400 font-medium">(Paced across whole 60 mins)</span> : ''}.</li>
                    <li>Non-Repeating Delays: <strong className="text-emerald-400">{nonRepeatingDelays ? 'Active (Never repeats same time)' : 'Standard'}</strong>.</li>
                    <li>Human Presence: <strong className="text-emerald-400">{typingSimulation ? 'Active (Shows typing status)' : 'Disabled'}</strong>.</li>
                    <li>Batch Safety: Cooldown of <strong className="text-white">{batchCooldownSeconds}s</strong> every <strong className="text-white">{batchSize} messages</strong>.</li>
                  </ul>
                </div>

                {/* Launch Bulk Campaign Now CTA Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleStartBulk}
                    disabled={sendingBulk || !connectionStatus.isConnected || totalLoadedRecipients === 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-40"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>
                      {sendingBulk
                        ? 'Broadcasting Campaign...'
                        : !connectionStatus.isConnected
                        ? 'Connect WhatsApp First'
                        : totalLoadedRecipients === 0
                        ? 'Select Recipients Above'
                        : `Launch Bulk Campaign Now (${totalLoadedRecipients})`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST CAMPAIGN HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Broadcast Campaign Logs
              </h2>
              <p className="text-xs text-slate-400">
                Detailed delivery reports for all bulk WhatsApp campaigns.
              </p>
            </div>

            <button
              onClick={fetchCampaigns}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCampaigns ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/70 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="p-3">Campaign Title</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Recipients</th>
                  <th className="p-3">Delivered</th>
                  <th className="p-3">Failed</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {loadingCampaigns ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">Loading campaign records...</td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">No campaigns launched yet.</td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-bold text-white">{c.title}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            c.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : c.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse'
                              : c.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{c.totalRecipients}</td>
                      <td className="p-3 font-bold text-emerald-400">{c.successCount}</td>
                      <td className="p-3 font-bold text-rose-400">{c.failedCount}</td>
                      <td className="p-3 text-slate-400">{new Date(c.createdAt).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.get(`/whatsapp/campaigns/${c._id}`);
                              if (res.data?.success) {
                                setSelectedCampaignModal(res.data.campaign);
                              }
                            } catch (e) {
                              showToast('Could not load campaign details', 'error');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] transition-colors"
                        >
                          View Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaignModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCampaignModal.title}</h3>
                <p className="text-xs text-slate-400">
                  Total {selectedCampaignModal.totalRecipients} Recipients • {selectedCampaignModal.successCount} Sent • {selectedCampaignModal.failedCount} Failed
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaignModal(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Attached Photo if present */}
              {(selectedCampaignModal.mediaBase64 || selectedCampaignModal.mediaUrl) && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Attached Broadcast Photo</span>
                  </p>
                  <div className="p-2 bg-slate-800/80 rounded-xl max-w-xs border border-emerald-500/20">
                    <img
                      src={selectedCampaignModal.mediaBase64 || selectedCampaignModal.mediaUrl}
                      alt="Campaign Attachment"
                      className="w-full max-h-48 object-cover rounded-lg shadow-sm"
                    />
                    {selectedCampaignModal.mediaFileName && (
                      <p className="text-[10px] text-slate-400 mt-1 truncate">{selectedCampaignModal.mediaFileName}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message Template / Caption Sent</p>
                <div className="p-3 bg-slate-800/80 rounded-xl text-xs text-slate-300 whitespace-pre-wrap">
                  {selectedCampaignModal.messageTemplate || <span className="italic text-slate-500">(No text caption - Photo only)</span>}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recipient Log List</p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedCampaignModal.recipients?.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-800/50 rounded-xl border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{r.name || 'Contact'} ({r.phone})</p>
                        {r.error && <p className="text-[10px] text-rose-400">{r.error}</p>}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'SENT'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : r.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedCampaignModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsApp;
