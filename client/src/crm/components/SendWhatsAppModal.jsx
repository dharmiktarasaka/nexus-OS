import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Sliders,
  Layers,
  Phone,
  HelpCircle,
  ExternalLink,
  Plus,
  Trash2,
  Copy,
  Shuffle,
  Clock,
  ShieldCheck,
  Shield,
  Rocket,
  Check,
  Image as ImageIcon,
  UploadCloud,
  FileImage,
  Paperclip,
  ListOrdered,
  ArrowRight,
  Radio,
  Pause,
  ChevronDown,
  ChevronUp,
  Settings,
  Activity,
  CheckCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const PRESET_TEMPLATES = [
  {
    id: 'intro',
    name: 'Introduction & Welcome',
    text: `Hello {name},\n\nThank you for reaching out to us! We are excited to connect with you regarding {company}.\n\nPlease let us know when is a good time for a brief discussion.\n\nBest regards,\nOur Team`
  },
  {
    id: 'followup',
    name: 'Quick Follow-up',
    text: `Hi {name},\n\nHope you are doing well. Just following up regarding our previous conversation about our services for {company}.\n\nDo you have 5 minutes this week to connect?`
  },
  {
    id: 'promo',
    name: 'Exclusive Promotion / Offer',
    text: `Special Offer for {name} & {company}! 🎉\n\nWe are currently offering exclusive benefits on our services this month.\n\nReply to this WhatsApp message to get full details!`
  },
  {
    id: 'meeting',
    name: 'Meeting / Appointment Reminder',
    text: `Hi {name},\n\nThis is a quick reminder regarding your upcoming appointment with our team.\n\nIf you need any assistance or have questions beforehand, please reply to this message.`
  }
];

export const SendWhatsAppModal = ({
  isOpen,
  onClose,
  folderId,
  folderName = 'Folder',
  headers = [],
  selectedRecordIds = [],
  activeDatasetId = 'all',
  search = '',
  columnFilters = {}
}) => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Active view tab: 'setup' or 'tracker'
  const [activeTab, setActiveTab] = useState('setup');
  const [showAdvancedPacing, setShowAdvancedPacing] = useState(false);

  // WhatsApp Connection State
  const [waStatus, setWaStatus] = useState({ isConnected: false, phone: '', loading: true });

  // Multiple Draft Templates State
  const [templates, setTemplates] = useState([
    `Hello {name},\n\nThank you for connecting with us regarding {company}. Please let us know if you have any questions!\n\nBest regards,\nOur Team`,
    `Hi {name},\n\nHope you are having a productive week! Reaching out from our team regarding {company}. When would be a good time to connect?\n\nBest,\nOur Team`,
    `Greetings {name}!\n\nWe have exciting updates tailored for {company}. Reply to this message if you'd like more details.\n\nRegards,\nOur Team`
  ]);
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);

  // Form States
  const [phoneField, setPhoneField] = useState('');
  const [nameField, setNameField] = useState('');
  const [sendScope, setSendScope] = useState(selectedRecordIds.length > 0 ? 'selected' : 'all');
  const [randomizeTemplates, setRandomizeTemplates] = useState(true);

  // Optional Image Attachment State
  const [attachedImage, setAttachedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Anti-Ban Safety Pacing & Algorithmic Shield State
  const [speedPreset, setSpeedPreset] = useState('safe_human');
  const [strictHourlyLimit, setStrictHourlyLimit] = useState(true);
  const [hourlyLimit, setHourlyLimit] = useState(15);
  const [nonRepeatingDelays, setNonRepeatingDelays] = useState(true);
  const [typingSimulation, setTypingSimulation] = useState(true);
  const [minDelaySeconds, setMinDelaySeconds] = useState(15.0);
  const [maxDelaySeconds, setMaxDelaySeconds] = useState(45.0);
  const [batchSize, setBatchSize] = useState(10);
  const [batchCooldownSeconds, setBatchCooldownSeconds] = useState(60);
  const [spintaxEnabled, setSpintaxEnabled] = useState(true);
  const [paceAcrossHour, setPaceAcrossHour] = useState(true);
  const [defaultCountryCode, setDefaultCountryCode] = useState('91');

  // Preview State
  const [previewTemplateIndex, setPreviewTemplateIndex] = useState(0);

  // Execution & Progress State
  const [sending, setSending] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [pollIntervalId, setPollIntervalId] = useState(null);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Preset switch handler
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

  // Spintax syntax parser
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

  // Auto-detect Phone & Name column from Excel headers
  useEffect(() => {
    if (headers && headers.length > 0) {
      const foundPhone = headers.find((h) => {
        const k = (h.key || '').toLowerCase();
        const l = (h.label || '').toLowerCase();
        return (
          k.includes('phone') ||
          k.includes('mobile') ||
          k.includes('contact') ||
          k.includes('whatsapp') ||
          k.includes('cell') ||
          l.includes('phone') ||
          l.includes('mobile') ||
          l.includes('contact')
        );
      });
      if (foundPhone) {
        setPhoneField(foundPhone.key);
      } else {
        setPhoneField(headers[0]?.key || '');
      }

      const foundName = headers.find((h) => {
        const k = (h.key || '').toLowerCase();
        const l = (h.label || '').toLowerCase();
        return (
          k.includes('name') ||
          k.includes('client') ||
          k.includes('customer') ||
          k.includes('decisionmaker') ||
          l.includes('name') ||
          l.includes('client')
        );
      });
      if (foundName) {
        setNameField(foundName.key);
      }
    }
  }, [headers]);

  // Adjust scope when selectedRecordIds changes
  useEffect(() => {
    if (selectedRecordIds && selectedRecordIds.length > 0) {
      setSendScope('selected');
    } else {
      setSendScope('all');
    }
  }, [selectedRecordIds]);

  // Check live WhatsApp connection status
  const checkWhatsAppStatus = async () => {
    try {
      setWaStatus((prev) => ({ ...prev, loading: true }));
      const res = await api.get('/whatsapp/status');
      if (res.data?.success) {
        setWaStatus({
          isConnected: res.data.isConnected,
          pushname: res.data.userProfile?.pushname || '',
          phone: res.data.userProfile?.phone || '',
          displayPhone: res.data.userProfile?.displayPhone || res.data.userProfile?.phone || '',
          loading: false
        });
      }
    } catch (e) {
      setWaStatus({ isConnected: false, pushname: '', phone: '', displayPhone: '', loading: false });
    }
  };

  // On modal open: ALWAYS default to setup mode! Never start sending automatically!
  useEffect(() => {
    if (isOpen) {
      setActiveTab('setup');
      setSending(false);
      checkWhatsAppStatus();
      api.get('/whatsapp/live-dispatch').then((res) => {
        if (res.data?.success && res.data.isRunning && res.data.campaign) {
          setCampaignProgress(res.data.campaign);
          // Keep activeTab as 'setup' so user has full control.
          // NEVER setSending(true) automatically!
          const cid = res.data.campaign._id || res.data.campaign.campaignId;
          if (cid) pollProgress(cid);
        } else {
          setCampaignProgress(null);
        }
      }).catch(() => {
        setCampaignProgress(null);
      });
    } else {
      setSending(false);
      if (pollIntervalId) clearInterval(pollIntervalId);
    }
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
      if (attachedImage?.previewUrl) {
        URL.revokeObjectURL(attachedImage.previewUrl);
      }
    };
  }, [isOpen]);

  // 1-second interval live countdown timer ticking down to next scheduled message
  useEffect(() => {
    if (!campaignProgress?.nextSendAt || !['IN_PROGRESS', 'STARTING'].includes(campaignProgress?.status)) {
      setTimeLeftSec(0);
      return;
    }

    const updateTimer = () => {
      const targetTime = new Date(campaignProgress.nextSendAt).getTime();
      const diffMs = targetTime - Date.now();
      const seconds = Math.max(0, Math.ceil(diffMs / 1000));
      setTimeLeftSec(seconds);
    };

    updateTimer();
    const ticker = setInterval(updateTimer, 1000);
    return () => clearInterval(ticker);
  }, [campaignProgress?.nextSendAt, campaignProgress?.status]);

  // Cancel/Stop in-progress campaign handler
  const handleCancelCampaign = async () => {
    if (!window.confirm('Are you sure you want to stop this WhatsApp broadcast immediately?')) return;
    try {
      setCancelling(true);
      const cid = campaignProgress?._id || campaignProgress?.campaignId;
      if (cid) {
        await api.post(`/whatsapp/campaigns/${cid}/cancel`);
      }
      await api.post('/whatsapp/live-dispatch/stop').catch(() => {});
      setCampaignProgress(null);
      setSending(false);
      if (pollIntervalId) clearInterval(pollIntervalId);
      showSuccess('WhatsApp broadcast stopped successfully.');
    } catch (e) {
      showError(e.response?.data?.message || 'Could not stop broadcast.');
    } finally {
      setCancelling(false);
    }
  };

  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return '00:00';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  // Insert tag variable into textarea
  const handleInsertTag = (tagKey) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const current = templates[activeTemplateIndex] || '';
    const insertText = `{${tagKey}}`;
    const updated = current.substring(0, start) + insertText + current.substring(end);

    const newTemplates = [...templates];
    newTemplates[activeTemplateIndex] = updated;
    setTemplates(newTemplates);

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 50);
  };

  // Add a new blank or template variation
  const handleAddTemplate = () => {
    const newIdx = templates.length;
    setTemplates((prev) => [
      ...prev,
      `Hello {name},\n\nWe have tailored options available for {company}. Please let us know if you would like to explore this!\n\nBest regards,\nOur Team`
    ]);
    setActiveTemplateIndex(newIdx);
    setPreviewTemplateIndex(newIdx);
  };

  // Duplicate current template
  const handleDuplicateTemplate = () => {
    const currentText = templates[activeTemplateIndex] || '';
    const newTemplates = [...templates, currentText];
    setTemplates(newTemplates);
    setActiveTemplateIndex(newTemplates.length - 1);
    setPreviewTemplateIndex(newTemplates.length - 1);
    showSuccess('Draft template duplicated as a new variation!');
  };

  // Delete a template variation
  const handleDeleteTemplate = (idxToDelete, e) => {
    e?.stopPropagation();
    if (templates.length <= 1) {
      showError('You must keep at least 1 message draft template');
      return;
    }
    const filtered = templates.filter((_, i) => i !== idxToDelete);
    setTemplates(filtered);
    const nextIdx = Math.max(0, activeTemplateIndex >= filtered.length ? filtered.length - 1 : activeTemplateIndex);
    setActiveTemplateIndex(nextIdx);
    setPreviewTemplateIndex(nextIdx);
  };

  // Random Preview Tester
  const handleTestRandomPick = () => {
    const randomIdx = Math.floor(Math.random() * templates.length);
    setPreviewTemplateIndex(randomIdx);
  };

  // Image Upload Handlers
  const handleImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('Image size exceeds 10MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      if (attachedImage?.previewUrl) {
        URL.revokeObjectURL(attachedImage.previewUrl);
      }
      setAttachedImage({
        file,
        previewUrl: URL.createObjectURL(file),
        base64: base64Data,
        mimeType: file.type,
        fileName: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
      showSuccess(`Image "${file.name}" attached successfully!`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveImage = () => {
    if (attachedImage?.previewUrl) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  // Estimated Contacts Count
  const estimatedContactsCount = sendScope === 'selected'
    ? selectedRecordIds.length
    : (headers?.find(h => h.key === phoneField)?.sampleValues?.length || 25);

  // Launch Broadcast
  const handleSendWhatsApp = async (e) => {
    e.preventDefault();

    if (!waStatus.isConnected) {
      showError('WhatsApp Web is not connected. Please scan the QR code first.');
      return;
    }

    if (!phoneField) {
      showError('Please select which column contains the Phone numbers');
      return;
    }

    const validTemplates = templates.filter((t) => t && t.trim());
    if (validTemplates.length === 0 && !attachedImage) {
      showError('Please enter at least one message draft template or attach an image');
      return;
    }

    try {
      setSending(true);
      const payload = {
        phoneField,
        nameField,
        messageTemplate: validTemplates[0] || '',
        templates: validTemplates,
        randomizeTemplates,
        speedPreset,
        strictHourlyLimit,
        hourlyLimit: Number(hourlyLimit) || 15,
        paceAcrossHour,
        nonRepeatingDelays,
        typingSimulation,
        batchSize: Number(batchSize) || 10,
        batchCooldownSeconds: Number(batchCooldownSeconds) || 60,
        spintaxEnabled,
        mediaBase64: attachedImage?.base64 || '',
        mediaMimeType: attachedImage?.mimeType || '',
        mediaFileName: attachedImage?.fileName || '',
        minDelaySeconds: Number(minDelaySeconds) || 15.0,
        maxDelaySeconds: Number(maxDelaySeconds) || 45.0,
        datasetId: activeDatasetId,
        recordIds: sendScope === 'selected' ? selectedRecordIds : undefined,
        search,
        columnFilters,
        defaultCountryCode
      };

      const res = await api.post(`/folders/${folderId}/send-whatsapp`, payload);

      if (res.data?.success) {
        showSuccess(res.data.message || 'WhatsApp broadcast started successfully!');
        const campaignId = res.data.campaignId;
        
        // Switch immediately to Live Tracker view with initial data
        setCampaignProgress({
          _id: campaignId,
          campaignId: campaignId,
          title: `Excel Broadcast - ${folderName}`,
          status: 'IN_PROGRESS',
          dispatchState: 'TYPING',
          totalRecipients: estimatedContactsCount,
          successCount: 0,
          failedCount: 0,
          recipients: []
        });
        setActiveTab('tracker');
        pollProgress(campaignId);
      }
    } catch (err) {
      setSending(false);
      showError(err.response?.data?.message || 'Failed to launch WhatsApp broadcast');
    }
  };

  const pollProgress = (campaignId) => {
    if (pollIntervalId) clearInterval(pollIntervalId);

    const check = async () => {
      try {
        const res = await api.get(`/whatsapp/campaigns/${campaignId}`);
        if (res.data?.success && res.data.campaign) {
          setCampaignProgress(res.data.campaign);
          if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(res.data.campaign.status)) {
            setSending(false);
            clearInterval(interval);
            showSuccess(`Broadcast ${res.data.campaign.status.toLowerCase()}!`);
          }
        }
      } catch (e) {}
    };

    check();
    const interval = setInterval(check, 1500);
    setPollIntervalId(interval);
  };

  const calculateEstimatedTime = () => {
    if (estimatedContactsCount === 0) return '0 minutes';

    let totalSeconds = 0;
    if (paceAcrossHour && strictHourlyLimit && Number(hourlyLimit) > 0) {
      const avgIntervalSeconds = 3600 / Number(hourlyLimit);
      totalSeconds = Math.max(1, estimatedContactsCount - 1) * avgIntervalSeconds;
    } else {
      const avgDelay = ((Number(minDelaySeconds) || 15) + (Number(maxDelaySeconds) || 45)) / 2;
      const typingDwell = typingSimulation ? 3 : 0;
      const basePacingSeconds = estimatedContactsCount * (avgDelay + typingDwell);

      const batchesCount = Math.floor(estimatedContactsCount / (Number(batchSize) || 10));
      const batchPauseSeconds = batchesCount * (Number(batchCooldownSeconds) || 60);

      totalSeconds = basePacingSeconds + batchPauseSeconds;

      if (strictHourlyLimit && Number(hourlyLimit) > 0) {
        const minSecondsForLimit = (estimatedContactsCount / Number(hourlyLimit)) * 3600;
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

  // Preview text for current previewTemplateIndex
  const rawPreviewText = (templates[previewTemplateIndex] || templates[0] || '')
    .replace(/\{name\}/gi, 'Alex Johnson')
    .replace(/\{phone\}/gi, '+91 9876543210')
    .replace(/\{number\}/gi, '9876543210')
    .replace(/\{wp_number\}/gi, '9876543210')
    .replace(/\{company\}/gi, 'Acme Corp')
    .replace(/\{date\}/gi, new Date().toLocaleDateString())
    .replace(/\{email\}/gi, 'alex@acmecorp.com');

  const activePreviewText = spintaxEnabled ? evaluateSpintax(rawPreviewText) : rawPreviewText;

  const isBroadcastActive = campaignProgress && ['IN_PROGRESS', 'STARTING'].includes(campaignProgress.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      {/* Container strictly limited to 92vh with flex-col so footer is ALWAYS visible */}
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* MODAL HEADER (Fixed shrink-0) */}
        <div className="bg-slate-950 px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  Excel WhatsApp Broadcast
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {folderName}
                </span>
                {isBroadcastActive && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    Live Dispatch Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                Multi-template random rotation • Anti-ban human pacing • Real-time queue tracker
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP STATUS & VIEW TOGGLE TABS (Fixed shrink-0) */}
        <div className="bg-slate-900 px-4 sm:px-6 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          {/* Main View Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab('setup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'setup'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>1. Setup & Send</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tracker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 relative ${
                activeTab === 'tracker'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>2. Live Tracker & Queue</span>
              {isBroadcastActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          </div>

          {/* WhatsApp Connection Pill */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-white/5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  waStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span className="font-medium text-slate-300 text-[11px] truncate max-w-[180px] sm:max-w-[240px]">
                {waStatus.loading ? (
                  'Checking WhatsApp...'
                ) : waStatus.isConnected ? (
                  waStatus.displayPhone || waStatus.phone || 'Online'
                ) : (
                  'Offline'
                )}
              </span>
            </div>

            {!waStatus.isConnected && !waStatus.loading && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/whatsapp');
                }}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-lg transition-all flex items-center gap-1"
              >
                <span>Connect</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            {waStatus.isConnected && (
              <button
                type="button"
                onClick={checkWhatsAppStatus}
                title="Refresh connection status"
                className="text-slate-400 hover:text-white p-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: SETUP FORM (Scrollable Body) */}
        {activeTab === 'setup' && (
          <>
            <form onSubmit={handleSendWhatsApp} id="whatsapp-broadcast-form" className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
              
              {/* Optional Alert: Background Broadcast Active */}
              {isBroadcastActive && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5 text-amber-900 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black truncate">
                        A WhatsApp broadcast is actively dispatching in the background.
                      </p>
                      <p className="text-[11px] text-amber-700">
                        {campaignProgress?.title || 'Broadcast'} ({campaignProgress?.successCount + campaignProgress?.failedCount}/{campaignProgress?.totalRecipients} processed).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab('tracker')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-xs"
                    >
                      View Live Tracker
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelCampaign}
                      disabled={cancelling}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {cancelling ? 'Stopping...' : 'Stop It'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 1: Excel Column Mapping & Audience Scope */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>1. Map Phone Column & Target Audience</span>
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Est. {estimatedContactsCount} Contacts
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Phone Column Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number Column *
                    </label>
                    <select
                      required
                      value={phoneField}
                      onChange={(e) => setPhoneField(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {headers.map((h) => (
                        <option key={h.key} value={h.key}>
                          {h.label} ({h.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Name Column Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Recipient Name Column
                    </label>
                    <select
                      value={nameField}
                      onChange={(e) => setNameField(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- No Name Column --</option>
                      {headers.map((h) => (
                        <option key={h.key} value={h.key}>
                          {h.label} ({h.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Scope Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Audience Scope
                    </label>
                    <select
                      value={sendScope}
                      onChange={(e) => setSendScope(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="all">All Records in Dataset</option>
                      {selectedRecordIds.length > 0 && (
                        <option value="selected">Selected Rows Only ({selectedRecordIds.length})</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 2: Multiple Draft Templates with Random Rotation */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-emerald-600" />
                      <span>2. Message Draft Variations (Anti-Spam Random Rotation)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      The CRM randomly rotates these templates per recipient so no two messages look identical.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleDuplicateTemplate}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                      title="Duplicate current draft"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddTemplate}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Variation</span>
                    </button>
                  </div>
                </div>

                {/* Draft Template Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {templates.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveTemplateIndex(idx);
                        setPreviewTemplateIndex(idx);
                      }}
                      className={`px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-2 text-xs font-bold shrink-0 transition-all border ${
                        activeTemplateIndex === idx
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Draft #{idx + 1}</span>
                      {templates.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTemplate(idx, e)}
                          className="p-0.5 hover:bg-rose-500/20 rounded-md text-inherit transition-colors"
                          title="Delete this template variation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Dynamic Variables & Preset Loader */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      Click tags to insert into Draft #{activeTemplateIndex + 1}:
                    </span>

                    <select
                      onChange={(e) => {
                        const t = PRESET_TEMPLATES.find((p) => p.id === e.target.value);
                        if (t) {
                          const newT = [...templates];
                          newT[activeTemplateIndex] = t.text;
                          setTemplates(newT);
                        }
                      }}
                      defaultValue=""
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="" disabled>
                        Load sample preset...
                      </option>
                      {PRESET_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                    {['name', 'phone', 'number', 'company', 'date', 'email', ...headers.map((h) => h.key)]
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleInsertTag(tag)}
                          className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 rounded-lg text-[10px] font-bold transition-colors"
                        >
                          &#123;{tag}&#125;
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => {
                        if (!textareaRef.current) return;
                        const start = textareaRef.current.selectionStart;
                        const end = textareaRef.current.selectionEnd;
                        const current = templates[activeTemplateIndex] || '';
                        const spintaxSample = '{Hello|Hi|Greetings}';
                        const updated = current.substring(0, start) + spintaxSample + current.substring(end);
                        const newT = [...templates];
                        newT[activeTemplateIndex] = updated;
                        setTemplates(newT);
                      }}
                      className="px-2 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                      title="Insert Spintax variation"
                    >
                      <Shuffle className="w-2.5 h-2.5 text-teal-700" />
                      <span>&#123;Hello|Hi|Hey&#125;</span>
                    </button>
                  </div>
                </div>

                {/* Message Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-slate-600">
                    <span>Message Body (Draft #{activeTemplateIndex + 1})</span>
                    <span>{(templates[activeTemplateIndex] || '').length} chars</span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    required={!attachedImage}
                    rows={4}
                    value={templates[activeTemplateIndex] || ''}
                    onChange={(e) => {
                      const newT = [...templates];
                      newT[activeTemplateIndex] = e.target.value;
                      setTemplates(newT);
                    }}
                    placeholder={`Type message text for Draft #${activeTemplateIndex + 1}...`}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Step 3: Photo / Image Attachment (Optional) */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>3. Attach Photo / Flyer</span>
                    <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
                  </h3>
                  {attachedImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!attachedImage ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-3 ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/60'
                        : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50 bg-slate-50/40'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">
                        <span className="text-emerald-700 hover:underline">Click to attach image</span> or drag and drop
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, WEBP (Max 10MB). Message will be sent as photo caption.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden border border-emerald-300 shrink-0 flex items-center justify-center">
                        <img
                          src={attachedImage.previewUrl}
                          alt="Attachment Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{attachedImage.fileName}</p>
                        <p className="text-[10px] text-slate-500">{attachedImage.size} • Attached as WhatsApp Photo</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 4: Speed Presets & Anti-Ban Protection */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>4. Anti-Ban Speed Presets</span>
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Est. Duration: {calculateEstimatedTime()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Preset 1: Ultra-Safe */}
                  <div
                    onClick={() => applySpeedPreset('ultra_safe')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      speedPreset === 'ultra_safe'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                      Zero-Ban Shield
                    </span>
                    <h5 className="text-xs font-black text-slate-900">Ultra-Safe (5/hr)</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">~12m delays • Safest for new numbers</p>
                  </div>

                  {/* Preset 2: Safe Human */}
                  <div
                    onClick={() => applySpeedPreset('safe_human')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      speedPreset === 'safe_human'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                      Recommended
                    </span>
                    <h5 className="text-xs font-black text-slate-900">Safe Human (15/hr)</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">~4m natural pacing • Human simulation</p>
                  </div>

                  {/* Preset 3: Balanced */}
                  <div
                    onClick={() => applySpeedPreset('balanced')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      speedPreset === 'balanced'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 mb-1">
                      Optimal Speed
                    </span>
                    <h5 className="text-xs font-black text-slate-900">Balanced (30/hr)</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">~2m delays • For seasoned accounts</p>
                  </div>
                </div>

                {/* Collapsible Advanced Anti-Ban Settings */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPacing(!showAdvancedPacing)}
                    className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showAdvancedPacing ? 'Hide Advanced Timing Settings' : 'Customize Advanced Timing & Cooldowns'}</span>
                    {showAdvancedPacing ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showAdvancedPacing && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 space-y-3 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Hourly Limit Slider */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>Max Hourly Limit:</span>
                            <span className="text-emerald-700 font-mono">{hourlyLimit} msg/hr</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={hourlyLimit}
                            onChange={(e) => {
                              setHourlyLimit(Number(e.target.value));
                              setSpeedPreset('custom');
                            }}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                        </div>

                        {/* Country Prefix */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Default Country Prefix:
                          </label>
                          <input
                            type="text"
                            value={defaultCountryCode}
                            onChange={(e) => setDefaultCountryCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="91"
                            className="w-full py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-bold text-slate-700 flex-wrap">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={typingSimulation}
                            onChange={(e) => setTypingSimulation(e.target.checked)}
                            className="rounded text-emerald-600 accent-emerald-600"
                          />
                          <span>Simulate Typing Presence</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={nonRepeatingDelays}
                            onChange={(e) => setNonRepeatingDelays(e.target.checked)}
                            className="rounded text-emerald-600 accent-emerald-600"
                          />
                          <span>Non-Repeating Jitter Delays</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 5: Smartphone Chat Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    Preview (Draft #{previewTemplateIndex + 1})
                  </span>

                  {templates.length > 1 && (
                    <button
                      type="button"
                      onClick={handleTestRandomPick}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Test Random Pick 🎲</span>
                    </button>
                  )}
                </div>

                <div className="bg-[#0b141a] p-3 rounded-xl border border-slate-800 max-w-md">
                  <div className="bg-[#005c4b] text-[#e9edef] p-3 rounded-xl rounded-tr-xs text-xs whitespace-pre-wrap leading-relaxed shadow-sm">
                    {attachedImage && (
                      <div className="mb-2 rounded-lg overflow-hidden max-h-44 bg-black/20 border border-white/10 flex items-center justify-center">
                        <img
                          src={attachedImage.previewUrl}
                          alt="Attachment"
                          className="w-full h-auto max-h-44 object-cover"
                        />
                      </div>
                    )}
                    {activePreviewText}
                    <div className="text-[9px] text-[#8696a0] text-right mt-1 flex items-center justify-end gap-1">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3 h-3 text-cyan-400" />
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* TAB 1 FIXED FOOTER (Fixed shrink-0 - ALWAYS VISIBLE!) */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {campaignProgress && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('tracker')}
                    className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-all flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-600" />
                    <span>View Live Progress</span>
                  </button>
                )}

                <button
                  type="submit"
                  form="whatsapp-broadcast-form"
                  disabled={sending || !waStatus.isConnected}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Starting Broadcast...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Start Real WhatsApp Broadcast ({estimatedContactsCount} Contacts)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: LIVE TRACKER & QUEUE VIEW (Scrollable Body) */}
        {activeTab === 'tracker' && (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-900 text-white">
              {campaignProgress ? (
                <>
                  {/* Status Banner */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isBroadcastActive
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-black text-white">
                            {campaignProgress.title || 'Excel WhatsApp Broadcast'}
                          </h3>
                          {isBroadcastActive ? (
                            campaignProgress.dispatchState === 'TYPING' || campaignProgress.dispatchState === 'SENDING' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                                Typing & Sending...
                              </span>
                            ) : campaignProgress.dispatchState === 'BATCH_COOLDOWN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                <Pause className="w-3 h-3 text-amber-400" />
                                Batch Rest Pause
                              </span>
                            ) : campaignProgress.dispatchState === 'HOURLY_THROTTLED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <Clock className="w-3 h-3 text-purple-400" />
                                Hourly Limit Throttled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                Anti-Ban Interval Active
                              </span>
                            )
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                campaignProgress.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {campaignProgress.status === 'COMPLETED' ? '✓ Finished' : campaignProgress.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Processed {campaignProgress.successCount + campaignProgress.failedCount} of{' '}
                          {campaignProgress.totalRecipients} contacts (
                          {Math.round(
                            ((campaignProgress.successCount + campaignProgress.failedCount) /
                              Math.max(1, campaignProgress.totalRecipients)) *
                              100
                          )}
                          %)
                        </p>
                      </div>
                    </div>

                    {isBroadcastActive && (
                      <button
                        type="button"
                        onClick={handleCancelCampaign}
                        disabled={cancelling}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>{cancelling ? 'Stopping...' : 'Stop Broadcast'}</span>
                      </button>
                    )}
                  </div>

                  {/* 3 Large Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Card 1: Next Message Countdown Timer */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Clock
                            className={`w-3.5 h-3.5 ${
                              isBroadcastActive ? 'text-emerald-400 animate-spin' : 'text-slate-400'
                            }`}
                          />
                          Next Message In
                        </span>
                        {isBroadcastActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </div>
                      <div className="my-2 text-center">
                        {isBroadcastActive ? (
                          timeLeftSec > 0 ? (
                            <div>
                              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-400 font-mono tracking-wider">
                                {formatCountdown(timeLeftSec)}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400">{timeLeftSec}s remaining</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xl font-black text-emerald-400 animate-pulse">Transmitting...</p>
                              <p className="text-[10px] text-slate-400">Simulating typing presence</p>
                            </div>
                          )
                        ) : (
                          <div>
                            <p className="text-xl font-black text-slate-400">00:00</p>
                            <p className="text-[10px] text-slate-500">Broadcast idle</p>
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Anti-Ban Preset</span>
                        <span className="font-bold text-white capitalize">
                          {campaignProgress.speedPreset ? campaignProgress.speedPreset.replace('_', ' ') : speedPreset.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Now Messaging */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-blue-400" />
                        {isBroadcastActive ? 'Now Messaging' : 'Last Sent'}
                      </span>
                      <div className="my-2">
                        {campaignProgress.currentRecipient?.phone ? (
                          <div>
                            <p className="text-base font-black text-white font-mono tracking-wide truncate flex items-center gap-1">
                              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                              {campaignProgress.currentRecipient.phone}
                            </p>
                            <p className="text-xs font-bold text-slate-300 truncate mt-0.5">
                              {campaignProgress.currentRecipient.name || 'Valued Lead'}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                (#{campaignProgress.currentRecipient.index} of {campaignProgress.totalRecipients})
                              </span>
                            </p>
                          </div>
                        ) : campaignProgress.lastSentPhone ? (
                          <div>
                            <p className="text-base font-black text-white font-mono tracking-wide truncate flex items-center gap-1">
                              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                              {campaignProgress.lastSentPhone}
                            </p>
                            <p className="text-xs font-bold text-slate-300 truncate mt-0.5">
                              {campaignProgress.lastSentName || 'Delivered Contact'}{' '}
                              <span className="text-[10px] text-emerald-400 font-normal">(Sent)</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-1">Initializing first contact...</p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Dispatch State</span>
                        <span className="font-bold text-emerald-400">
                          {isBroadcastActive ? 'Active' : campaignProgress.status}
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Next In Line */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                        Next In Line
                      </span>
                      <div className="my-2">
                        {campaignProgress.nextRecipient?.phone ? (
                          <div>
                            <p className="text-base font-black text-amber-300 font-mono tracking-wide truncate flex items-center gap-1">
                              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                              {campaignProgress.nextRecipient.phone}
                            </p>
                            <p className="text-xs font-bold text-slate-300 truncate mt-0.5">
                              {campaignProgress.nextRecipient.name || 'Upcoming Lead'}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                (#{campaignProgress.nextRecipient.index} of {campaignProgress.totalRecipients})
                              </span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic py-1">
                            {isBroadcastActive ? 'Final contact in queue' : 'Queue idle'}
                          </p>
                        )}
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Pending</span>
                        <span className="font-bold text-white font-mono">
                          {Math.max(
                            0,
                            campaignProgress.totalRecipients -
                              (campaignProgress.successCount + campaignProgress.failedCount)
                          )}{' '}
                          contacts
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Counters */}
                  <div className="space-y-1.5 bg-slate-950 p-3.5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">
                        Broadcast Progress:{' '}
                        <span className="text-white font-mono">
                          {Math.round(
                            ((campaignProgress.successCount + campaignProgress.failedCount) /
                              Math.max(1, campaignProgress.totalRecipients)) *
                              100
                          )}
                          %
                        </span>
                      </span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-emerald-400">✓ {campaignProgress.successCount} Delivered</span>
                        <span className="text-rose-400">✕ {campaignProgress.failedCount} Failed</span>
                        <span className="text-slate-400">
                          ⏳{' '}
                          {Math.max(
                            0,
                            campaignProgress.totalRecipients -
                              (campaignProgress.successCount + campaignProgress.failedCount)
                          )}{' '}
                          Pending
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              ((campaignProgress.successCount + campaignProgress.failedCount) /
                                Math.max(1, campaignProgress.totalRecipients)) *
                                100
                            )
                          )}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Built-in Live Queue Table */}
                  <div className="bg-slate-950 rounded-xl border border-white/10 overflow-hidden">
                    <div className="p-3 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Full Live Queue ({campaignProgress.recipients?.length || campaignProgress.totalRecipients || 0} Contacts)
                        </h4>
                      </div>
                      <span className="text-[10px] text-slate-400">Real-time status updates</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-bold text-[10px] tracking-wider sticky top-0 border-b border-white/5">
                          <tr>
                            <th className="p-2.5">#</th>
                            <th className="p-2.5">Recipient</th>
                            <th className="p-2.5">Phone</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5">Time / Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {campaignProgress.recipients && campaignProgress.recipients.length > 0 ? (
                            campaignProgress.recipients.map((r, idx) => {
                              const isCurrent = campaignProgress.currentRecipient?.phone === r.phone;
                              const isNext = campaignProgress.nextRecipient?.phone === r.phone;
                              return (
                                <tr
                                  key={r._id || idx}
                                  className={
                                    isCurrent
                                      ? 'bg-blue-500/20 font-bold'
                                      : isNext
                                      ? 'bg-amber-500/15'
                                      : 'hover:bg-white/5'
                                  }
                                >
                                  <td className="p-2.5 text-slate-500 font-mono">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                                    <span className="truncate max-w-[140px]">{r.name || 'Contact'}</span>
                                    {isCurrent && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-blue-500 text-white font-black shrink-0">
                                        ACTIVE
                                      </span>
                                    )}
                                    {isNext && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-slate-950 font-black shrink-0">
                                        NEXT
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2.5 font-mono text-emerald-300 font-bold">{r.phone}</td>
                                  <td className="p-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                        r.status === 'SENT'
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : r.status === 'SENDING' || isCurrent
                                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                                          : r.status === 'FAILED'
                                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                          : isNext
                                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                          : 'bg-slate-800 text-slate-400'
                                      }`}
                                    >
                                      {r.status === 'SENT' && '✓ SENT'}
                                      {(r.status === 'SENDING' || isCurrent) && '● SENDING'}
                                      {r.status === 'FAILED' && '✕ FAILED'}
                                      {r.status === 'PENDING' && (isNext ? '⏳ NEXT UP' : 'QUEUED')}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-[11px] text-slate-400">
                                    {r.error ? (
                                      <span className="text-rose-400">{r.error}</span>
                                    ) : r.sentAt ? (
                                      new Date(r.sentAt).toLocaleTimeString()
                                    ) : isCurrent ? (
                                      <span className="text-blue-300">Sending right now...</span>
                                    ) : isNext && timeLeftSec > 0 ? (
                                      <span className="text-amber-300">In {timeLeftSec}s</span>
                                    ) : (
                                      'In queue'
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="p-6 text-center text-slate-400 italic">
                                Loading queue recipients...
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center space-y-3">
                  <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
                  <h4 className="text-base font-bold text-white">No Active Broadcast Running</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Switch to the "Setup & Send" tab to configure your message drafts and launch your WhatsApp broadcast.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('setup')}
                    className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                  >
                    Go to Setup & Send
                  </button>
                </div>
              )}
            </div>

            {/* TAB 2 FIXED FOOTER (Fixed shrink-0) */}
            <div className="bg-slate-950 border-t border-white/10 px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0 text-white">
              {isBroadcastActive ? (
                <button
                  type="button"
                  onClick={handleCancelCampaign}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {cancelling ? 'Stopping...' : 'Stop Broadcast'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('setup')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
                >
                  Configure New Broadcast
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Close Window
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default SendWhatsAppModal;
