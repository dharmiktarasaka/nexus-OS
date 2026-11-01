import React, { useState, useEffect } from 'react';
import {
  X, Mail, Send, Server, CheckCircle2, AlertCircle, Loader2, Save, Key, Tag,
  ShieldCheck, Clock, Calendar, ShieldAlert, Plus, Trash2, KeyRound, Info, Eye, EyeOff,
  Bold, Italic, List, ListOrdered, Link2, Sparkles, RefreshCw, PenTool, Code,
  Wand2, Bot, Zap, Check, ArrowRight, ChevronRight, Settings2
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const SendEmailModal = ({
  isOpen,
  onClose,
  folderId,
  headers = [],
  selectedRecordIds = [],
  activeDatasetId = 'all',
  search = '',
  columnFilters = {}
}) => {
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('template'); // 'smtp' | 'template' | 'results'

  // SMTP Settings State
  const [smtpConfig, setSmtpConfig] = useState({
    authType: 'password', // 'password' | 'oauth2'
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    clientId: '',
    clientSecret: '',
    tenantId: '',
    refreshToken: '',
    fromName: '',
    signature: '',
    includeSignature: true,
    jobTitle: '',
    phone: '',
    companyName: '',
    website: ''
  });

  const [saveSmtp, setSaveSmtp] = useState(true);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestedOk, setSmtpTestedOk] = useState(null);
  const [generatingSignature, setGeneratingSignature] = useState(false);
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);

  // Secret Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showRefreshToken, setShowRefreshToken] = useState(false);

  // Email Template & Target State
  const [emailField, setEmailField] = useState('');
  const [sendScope, setSendScope] = useState(selectedRecordIds.length > 0 ? 'selected' : 'all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [bodyTab, setBodyTab] = useState('edit'); // 'edit' | 'preview'

  // Multiple Automated Follow-up Emails State
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [followUps, setFollowUps] = useState([
    { id: 1, delayDays: '1', customDate: '', subject: '', body: '' }
  ]);

  // DeepSeek AI Sequence Writer State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModel, setAiModel] = useState('deepseek-ai/deepseek-v4-pro-0813');
  const [aiGoal, setAiGoal] = useState('Cold Outreach & Value Pitch');
  const [aiTone, setAiTone] = useState('Persuasive & High Converting');
  const [aiOfferDescription, setAiOfferDescription] = useState('');
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiFollowUpCount, setAiFollowUpCount] = useState(2);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [hasDeepseekKey, setHasDeepseekKey] = useState(false);
  const [aiApiKey, setAiApiKey] = useState('');
  const [showAiKeyInput, setShowAiKeyInput] = useState(false);
  const [savingAiKey, setSavingAiKey] = useState(false);
  const [generatedAiSequence, setGeneratedAiSequence] = useState(null);
  const [aiPreviewTab, setAiPreviewTab] = useState('initial');

  // Sending Process State
  const [sending, setSending] = useState(false);
  const [sendResults, setSendResults] = useState(null);

  // Auto-detect Email Header
  useEffect(() => {
    if (headers && headers.length > 0) {
      const emailHeader = headers.find(h => {
        const k = h.key.toLowerCase();
        const l = h.label.toLowerCase();
        return k.includes('email') || k.includes('mail') || l.includes('email') || l.includes('mail');
      });
      if (emailHeader) {
        setEmailField(emailHeader.key);
      } else {
        setEmailField(headers[0].key);
      }
    }
  }, [headers]);

  // Load saved SMTP and DeepSeek configuration on mount
  useEffect(() => {
    if (isOpen) {
      fetchSmtpConfig();
      fetchDeepSeekConfig();
    }
  }, [isOpen]);

  const fetchDeepSeekConfig = async () => {
    try {
      const res = await api.get('/lead-grab/deepseek-key');
      if (res.data?.success) {
        setHasDeepseekKey(Boolean(res.data.hasKey));
        if (res.data.rawKey) setAiApiKey(res.data.rawKey);
        if (res.data.model) {
          let m = res.data.model;
          if (m.includes('v4') || m.includes('flash')) {
            m = res.data.rawKey?.startsWith('nvapi') ? 'deepseek-ai/deepseek-v3' : 'deepseek-chat';
          }
          setAiModel(m);
        } else {
          setAiModel('deepseek-ai/deepseek-v3');
        }
      }
    } catch (err) {
      // Ignore if endpoint fails
    }
  };

  const handleSaveDeepseekKey = async () => {
    if (!aiApiKey.trim()) {
      showError('Please enter a DeepSeek API key');
      return;
    }
    setSavingAiKey(true);
    try {
      await api.post('/lead-grab/deepseek-key', {
        apiKey: aiApiKey.trim(),
        model: aiModel
      });
      setHasDeepseekKey(true);
      setShowAiKeyInput(false);
      showSuccess('DeepSeek API Key saved successfully!');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save DeepSeek key');
    } finally {
      setSavingAiKey(false);
    }
  };

  const handleGenerateAiSequence = async () => {
    setGeneratingAi(true);
    try {
      const targetEndpoint = folderId ? `/folders/${folderId}/generate-ai-email` : `/folders/generate-ai-email`;
      const payload = {
        apiKey: aiApiKey,
        model: aiModel || 'deepseek-ai/deepseek-v3',
        goal: aiGoal,
        tone: aiTone,
        offerDescription: aiOfferDescription,
        customPrompt: aiCustomPrompt,
        headers: headers || [],
        followUpCount: aiFollowUpCount
      };

      const res = await api.post(targetEndpoint, payload);
      if (res.data?.success && res.data.initialEmail) {
        setGeneratedAiSequence({
          initialEmail: res.data.initialEmail,
          followUps: res.data.followUps || []
        });
        setAiPreviewTab('initial');
        showSuccess(`✨ Personalized sequence written with ${res.data.modelUsed || aiModel}!`);
      } else {
        showError(res.data?.message || 'Failed to generate email sequence');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'AI Generation failed. Check your DeepSeek API key.';
      showError(errorMsg);
      if (errorMsg.toLowerCase().includes('key') || !hasDeepseekKey) {
        setShowAiKeyInput(true);
      }
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleUpdateAiInitial = (field, value) => {
    setGeneratedAiSequence(prev => {
      if (!prev || !prev.initialEmail) return prev;
      return {
        ...prev,
        initialEmail: {
          ...prev.initialEmail,
          [field]: value
        }
      };
    });
  };

  const handleUpdateAiFollowUp = (idx, field, value) => {
    setGeneratedAiSequence(prev => {
      if (!prev || !prev.followUps) return prev;
      const updatedFollowUps = [...prev.followUps];
      if (updatedFollowUps[idx]) {
        updatedFollowUps[idx] = {
          ...updatedFollowUps[idx],
          [field]: value
        };
      }
      return {
        ...prev,
        followUps: updatedFollowUps
      };
    });
  };

  const handleApplyAiSequence = () => {
    if (!generatedAiSequence || !generatedAiSequence.initialEmail) return;

    // Apply Initial Email Subject & Body
    setSubject(generatedAiSequence.initialEmail.subject || '');
    setBody(generatedAiSequence.initialEmail.body || '');

    // Apply Follow-ups
    if (generatedAiSequence.followUps && generatedAiSequence.followUps.length > 0) {
      setFollowUpEnabled(true);
      const mappedFollowUps = generatedAiSequence.followUps.map((f, idx) => ({
        id: idx + 1,
        delayDays: f.delayDays || String((idx + 1) * 2),
        customDate: '',
        subject: f.subject || '',
        body: f.body || ''
      }));
      setFollowUps(mappedFollowUps);
    }

    setShowAiModal(false);
    showSuccess('✨ Personalized email and follow-ups applied to campaign!');
  };

  const fetchSmtpConfig = async () => {
    try {
      const res = await api.get('/users/smtp-config');
      if (res.data?.success && res.data.smtpConfig) {
        const cfg = res.data.smtpConfig;
        setSmtpConfig({
          authType: cfg.authType || 'password',
          host: cfg.host || 'smtp.office365.com',
          port: cfg.port || 587,
          secure: Boolean(cfg.secure),
          user: cfg.user || '',
          pass: cfg.pass || '',
          clientId: cfg.clientId || '',
          clientSecret: cfg.clientSecret || '',
          tenantId: cfg.tenantId || '',
          refreshToken: cfg.refreshToken || '',
          fromName: cfg.fromName || '',
          signature: cfg.signature || '',
          includeSignature: cfg.includeSignature !== undefined ? Boolean(cfg.includeSignature) : true,
          jobTitle: cfg.jobTitle || '',
          phone: cfg.phone || '',
          companyName: cfg.companyName || '',
          website: cfg.website || ''
        });
      }
    } catch (err) {
      // Ignore if user has no saved SMTP config
    }
  };

  const handleSmtpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSmtpConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setSmtpTestedOk(null);
  };

  const handleAuthTypeChange = (type) => {
    setSmtpConfig(prev => ({
      ...prev,
      authType: type,
      host: type === 'oauth2' ? 'smtp.office365.com' : (prev.host || 'smtp.office365.com'),
      clientId: type === 'oauth2' ? (prev.clientId || '') : '',
      tenantId: type === 'oauth2' ? (prev.tenantId || '') : '',
      port: 587,
      secure: false
    }));
    setSmtpTestedOk(null);
  };

  const handleConnectOutlook = async () => {
    const cId = (smtpConfig.clientId || '').trim();
    const cSecret = (smtpConfig.clientSecret || smtpConfig.pass || '').trim();
    const tId = (smtpConfig.tenantId || '').trim();

    if (!cId) {
      showError('Please enter your Application (Client) ID first.');
      return;
    }
    if (!cSecret) {
      showError('Please enter your Client Secret first.');
      return;
    }

    try {
      if (saveSmtp) {
        const configToSave = {
          ...smtpConfig,
          authType: 'oauth2',
          clientId: cId,
          clientSecret: cSecret,
          pass: cSecret,
          tenantId: tId
        };
        await api.put('/users/smtp-config', configToSave);
      }

      sessionStorage.setItem('outlook_auth_config', JSON.stringify({
        clientId: cId,
        clientSecret: cSecret,
        tenantId: tId
      }));

      const redirectUri = window.location.origin + '/auth/outlook/callback';
      const params = new URLSearchParams({
        clientId: cId,
        redirectUri
      });
      if (tId) {
        params.append('tenantId', tId);
      }

      const res = await api.get(`/outlook/authorize?${params.toString()}`);
      if (res.data?.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        showError(res.data?.message || 'Failed to get Microsoft authorization URL');
      }
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to initiate Microsoft Outlook connection');
    }
  };

  const handleTestSmtp = async () => {
    if (smtpConfig.authType !== 'oauth2' && !smtpConfig.user) {
      showError('Please enter your Email Address');
      return;
    }

    setTestingSmtp(true);
    setSmtpTestedOk(null);
    try {
      const res = await api.post(`/users/test-email-connection`, smtpConfig);
      if (res.data?.success) {
        setSmtpTestedOk(true);
        showSuccess(res.data.message || 'Mail connection verified successfully!');
      }
    } catch (err) {
      setSmtpTestedOk(false);
      showError(err.response?.data?.message || err.message || 'Connection Test Failed');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleSaveSmtp = async () => {
    try {
      const res = await api.put('/users/smtp-config', smtpConfig);
      if (res.data?.success) {
        showSuccess('Mail & signature settings saved to your profile');
      }
    } catch (err) {
      showError('Failed to save settings');
    }
  };

  const handleGenerateOutlookSignature = async () => {
    setGeneratingSignature(true);
    try {
      const res = await api.post('/outlook/generate-signature', {
        displayName: smtpConfig.fromName || '',
        jobTitle: smtpConfig.jobTitle || '',
        companyName: smtpConfig.companyName || '',
        email: smtpConfig.user || '',
        phone: smtpConfig.phone || '',
        website: smtpConfig.website || ''
      });
      if (res.data?.success && res.data.signature) {
        setSmtpConfig(prev => ({
          ...prev,
          signature: res.data.signature,
          includeSignature: true
        }));
        showSuccess('Outlook signature generated from profile details!');
      }
    } catch (err) {
      showError('Failed to auto-generate signature');
    } finally {
      setGeneratingSignature(false);
    }
  };

  const insertVariable = (variableKey, fieldTarget = 'body') => {
    const placeholder = `{{${variableKey}}}`;
    if (fieldTarget === 'subject') {
      setSubject(prev => prev + ' ' + placeholder);
    } else {
      setBody(prev => prev + ' ' + placeholder);
    }
  };

  const insertFormatting = (formatType) => {
    switch (formatType) {
      case 'bold':
        setBody(prev => prev + ' <b>Bold Text</b> ');
        break;
      case 'italic':
        setBody(prev => prev + ' <i>Italic Text</i> ');
        break;
      case 'bullet':
        setBody(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '- Bullet Item 1\n- Bullet Item 2\n');
        break;
      case 'numbered':
        setBody(prev => prev + (prev.endsWith('\n') ? '' : '\n') + '1. Step 1\n2. Step 2\n');
        break;
      case 'link':
        setBody(prev => prev + ' <a href="https://example.com" style="color: #2563eb; text-decoration: underline;">Link Text</a> ');
        break;
      case 'line':
        setBody(prev => prev + '\n\n');
        break;
      default:
        break;
    }
  };

  const getPreviewHtml = (rawText) => {
    if (!rawText && !smtpConfig.signature) {
      return '<p style="color: #94a3b8; font-style: italic;">(Email body is empty. Type your message above to see live preview...)</p>';
    }

    let interpolated = rawText || '';
    // Replace standard tags with dummy values or column headers
    if (headers && headers.length > 0) {
      headers.forEach(h => {
        const regexK = new RegExp(`\\{\\{\\s*${h.key}\\s*\\}\\}`, 'gi');
        const regexL = new RegExp(`\\{\\{\\s*${h.label}\\s*\\}\\}`, 'gi');
        interpolated = interpolated.replace(regexK, `<strong>${h.label}</strong>`).replace(regexL, `<strong>${h.label}</strong>`);
      });
    }

    interpolated = interpolated
      .replace(/\{\{\s*name\s*\}\}/gi, '<strong>John Doe</strong>')
      .replace(/\{\{\s*company(name)?\s*\}\}/gi, '<strong>Acme Corp</strong>')
      .replace(/\{\{\s*email\s*\}\}/gi, '<strong>john.doe@example.com</strong>')
      .replace(/\{\{\s*phone\s*\}\}/gi, '<strong>+1 (555) 019-2834</strong>');

    // Parse HTML or format paragraphs
    const hasHtml = /<(html|body|table|div|p|blockquote|ul|ol)[^>]*>/i.test(interpolated);
    let bodyFormatted = '';
    if (hasHtml) {
      bodyFormatted = interpolated.replace(/\n/g, '<br/>');
    } else {
      const paragraphs = interpolated.split(/\n\s*\n/);
      bodyFormatted = paragraphs.map(p => {
        const lines = p.trim().split('\n');
        const isBullet = lines.length > 0 && lines.every(l => /^\s*[-*•]\s+/.test(l));
        const isNum = lines.length > 0 && lines.every(l => /^\s*\d+[\.)]\s+/.test(l));
        if (isBullet) {
          return `<ul style="margin: 0 0 12px 0; padding-left: 20px; color: #1e293b;">${lines.map(l => `<li style="margin-bottom: 4px;">${l.replace(/^\s*[-*•]\s+/, '')}</li>`).join('')}</ul>`;
        }
        if (isNum) {
          return `<ol style="margin: 0 0 12px 0; padding-left: 20px; color: #1e293b;">${lines.map(l => `<li style="margin-bottom: 4px;">${l.replace(/^\s*\d+[\.)]\s+/, '')}</li>`).join('')}</ol>`;
        }
        return `<p style="margin: 0 0 12px 0; line-height: 1.6; color: #1e293b;">${lines.join('<br/>')}</p>`;
      }).join('');
    }

    const signatureHtml = (smtpConfig.includeSignature && smtpConfig.signature)
      ? `<div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0;">${smtpConfig.signature}</div>`
      : '';

    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b;">${bodyFormatted}${signatureHtml}</div>`;
  };

  const addFollowUpStep = () => {
    const nextId = followUps.length > 0 ? Math.max(...followUps.map(f => f.id)) + 1 : 1;
    const defaultDays = String(Math.min(14, (followUps.length + 1) * 2));
    setFollowUps(prev => [
      ...prev,
      { id: nextId, delayDays: defaultDays, customDate: '', subject: '', body: '' }
    ]);
  };

  const removeFollowUpStep = (id) => {
    setFollowUps(prev => prev.filter(f => f.id !== id));
  };

  const updateFollowUpStep = (id, field, value) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const insertVariableToFollowUp = (id, field, variableKey) => {
    const placeholder = `{{${variableKey}}}`;
    setFollowUps(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, [field]: (f[field] || '') + ' ' + placeholder };
      }
      return f;
    }));
  };

  const handleSendEmails = async () => {
    if (!smtpConfig.user) {
      showError('Please enter Email Address');
      setActiveTab('smtp');
      return;
    }

    if (!emailField) {
      showError('Please select which column contains Recipient Email addresses');
      return;
    }

    if (!subject.trim()) {
      showError('Initial Email subject line cannot be empty');
      return;
    }

    if (!body.trim()) {
      showError('Initial Email body message cannot be empty');
      return;
    }

    if (followUpEnabled) {
      if (followUps.length === 0) {
        showError('Please add at least one follow-up step or uncheck automated follow-ups');
        return;
      }
      for (let i = 0; i < followUps.length; i++) {
        const fu = followUps[i];
        if (!fu.subject.trim()) {
          showError(`Follow-Up #${i + 1} subject line is required`);
          return;
        }
        if (!fu.body.trim()) {
          showError(`Follow-Up #${i + 1} email body is required`);
          return;
        }
      }
    }

    if (saveSmtp) {
      handleSaveSmtp();
    }

    setSending(true);
    setSendResults(null);

    try {
      const payload = {
        smtpConfig,
        emailField,
        subject,
        body,
        signature: smtpConfig.signature,
        includeSignature: smtpConfig.includeSignature,
        followUpConfigs: followUpEnabled ? followUps.map(f => ({
          enabled: true,
          delayDays: f.delayDays !== 'custom' ? f.delayDays : null,
          scheduleTime: f.delayDays === 'custom' ? f.customDate : null,
          subject: f.subject,
          body: f.body
        })) : [],
        datasetId: activeDatasetId,
        recordIds: sendScope === 'selected' ? selectedRecordIds : [],
        search,
        columnFilters
      };

      const res = await api.post(`/folders/${folderId}/send-emails`, payload);
      if (res.data?.success) {
        setSendResults(res.data);
        setActiveTab('results');
        showSuccess(res.data.message || 'Emails sent successfully!');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to dispatch emails');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-crm-navy via-slate-900 to-crm-navy text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
              <Mail className="w-5 h-5 text-crm-lime" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">Send Bulk & Follow-Up Emails</h3>
              <p className="text-xs text-slate-300">Supports Outlook, Gmail, Yahoo, Zoho & Custom SMTP</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-100 bg-slate-50/50 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'template'
                ? 'bg-crm-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            1. Email Template & Follow-Ups ({followUpEnabled ? `${followUps.length} Step(s)` : 'Initial Only'})
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'smtp'
                ? 'bg-crm-navy text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            2. Email Account / Outlook Credentials
            {smtpTestedOk === true && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {sendResults && (
            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                activeTab === 'results'
                  ? 'bg-crm-navy text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              3. Delivery Status Report
            </button>
          )}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          
          {/* TAB 1: EMAIL TEMPLATE & RECIPIENTS */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              
              {/* DeepSeek AI Auto-Composer Card */}
              <div className="p-4 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-2xl border border-purple-500/30 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative z-10 flex items-start gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md shrink-0">
                    <Sparkles className="w-5 h-5 text-crm-lime animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                        DeepSeek AI Email & Follow-Up Sequence Writer
                      </h4>
                      <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[10px] font-black rounded-full uppercase tracking-wider">
                        DeepSeek AI & NVIDIA NIM
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200/90 mt-0.5">
                      Auto-compose hyper-personalized initial emails and multi-step follow-up sequences using dynamic variables for every recipient.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAiModal(true)}
                  className="relative z-10 px-4 py-2.5 bg-gradient-to-r from-crm-lime to-emerald-400 hover:from-crm-lime-hover hover:to-emerald-500 text-crm-navy font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 group"
                >
                  <Wand2 className="w-4 h-4 text-crm-navy group-hover:rotate-12 transition-transform" />
                  <span>✨ AI Write Email & Follow-Ups</span>
                </button>
              </div>

              {/* Anti-Spam Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-amber-900">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-[11px]">
                  <span className="font-bold">Anti-Spam Throttling Protection:</span> Emails are sent one-by-one with a <strong>5 to 10 second random delay</strong> between each recipient to prevent spam flags.
                </div>
              </div>

              {/* Recipient Scope & Column Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="block font-extrabold text-crm-navy mb-1">
                    Target Recipient Scope
                  </label>
                  <select
                    value={sendScope}
                    onChange={(e) => setSendScope(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold focus:ring-2 focus:ring-crm-navy/20"
                  >
                    <option value="all">All Records in Dataset / View</option>
                    {selectedRecordIds.length > 0 && (
                      <option value="selected">Selected Table Rows Only ({selectedRecordIds.length} checked)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-extrabold text-crm-navy mb-1">
                    Select Email Address Column
                  </label>
                  <select
                    value={emailField}
                    onChange={(e) => setEmailField(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold focus:ring-2 focus:ring-crm-navy/20"
                  >
                    {headers.map(h => (
                      <option key={h.key} value={h.key}>
                        {h.label} ({h.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Initial Subject Line with AI Trigger */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-extrabold text-crm-navy">
                    Initial Email Subject Line *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="text-[11px] font-black text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-0.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    ✨ AI Compose Sequence
                  </button>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Special Proposal for {{Name}}"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium focus:ring-2 focus:ring-crm-navy/20"
                />
              </div>

              {/* Dynamic Variables Quick Chips */}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-600 mb-2">
                  <Tag className="w-3.5 h-3.5 text-crm-navy" />
                  <span>Click to insert variable tags into subject or body:</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                  {headers.map(h => (
                    <button
                      key={h.key}
                      type="button"
                      onClick={() => insertVariable(h.key, 'body')}
                      className="px-2.5 py-1 bg-white hover:bg-crm-lime hover:text-crm-navy text-slate-700 font-extrabold text-[11px] rounded-lg border border-slate-200 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      + {`{{${h.key}}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Message Body with Formatting Toolbar & Live Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-extrabold text-crm-navy">
                    Initial Email Body Content (Supports HTML & Formatted Text) *
                  </label>
                  
                  {/* Mode Switcher: Edit vs Live Preview */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setBodyTab('edit')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all ${
                        bodyTab === 'edit'
                          ? 'bg-white text-crm-navy shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <PenTool className="w-3 h-3 text-crm-lime" />
                      Edit Template
                    </button>
                    <button
                      type="button"
                      onClick={() => setBodyTab('preview')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all ${
                        bodyTab === 'preview'
                          ? 'bg-crm-navy text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3 h-3 text-crm-lime" />
                      Live Preview & Signature
                    </button>
                  </div>
                </div>

                {bodyTab === 'edit' ? (
                  <div className="space-y-2">
                    {/* Quick Formatting Toolbar */}
                    <div className="flex items-center gap-1 flex-wrap p-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                      <span className="text-[10px] font-extrabold text-slate-400 px-1 uppercase">Format:</span>
                      <button
                        type="button"
                        onClick={() => insertFormatting('bold')}
                        title="Bold text"
                        className="p-1 px-2 hover:bg-white hover:shadow-2xs rounded-lg font-black text-xs border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('italic')}
                        title="Italic text"
                        className="p-1 px-2 hover:bg-white hover:shadow-2xs rounded-lg font-medium italic text-xs border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('bullet')}
                        title="Bullet list"
                        className="p-1 px-2 hover:bg-white hover:shadow-2xs rounded-lg text-xs border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1 font-bold"
                      >
                        <List className="w-3.5 h-3.5" />
                        Bullet
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('numbered')}
                        title="Numbered list"
                        className="p-1 px-2 hover:bg-white hover:shadow-2xs rounded-lg text-xs border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1 font-bold"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                        1,2,3
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('link')}
                        title="Insert hyperlink"
                        className="p-1 px-2 hover:bg-white hover:shadow-2xs rounded-lg text-xs border border-transparent hover:border-slate-200 transition-colors flex items-center gap-1 font-bold"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Link
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFormatting('line')}
                        title="Paragraph Break"
                        className="p-1 px-2 hover:bg-white hover:shadow-2xs rounded-lg text-xs border border-transparent hover:border-slate-200 transition-colors font-bold text-[11px]"
                      >
                        ¶ Paragraph
                      </button>
                      
                      <div className="ml-auto text-[10px] text-slate-400 font-medium hidden sm:block">
                        Linebreaks & formatting are automatically preserved on send
                      </div>
                    </div>

                    <textarea
                      rows={6}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder={`Hi {{Name}},\n\nWe are reaching out regarding your inquiry for {{companyName}}.\n\nKey Highlights:\n- Fast 24/7 Response\n- Dedicated Account Manager\n\nPlease let us know when you are available for a brief call.\n\nBest regards,\nSales Team`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-crm-navy/20 leading-relaxed text-slate-800"
                    />
                  </div>
                ) : (
                  /* Live Rendered HTML & Signature Preview */
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-[11px] text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-crm-navy">Subject:</span>
                        <span className="font-medium text-slate-800">{subject || '(No Subject Line)'}</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Email Client Rendering Preview
                      </span>
                    </div>

                    <div
                      className="p-4 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs shadow-2xs min-h-[140px]"
                      dangerouslySetInnerHTML={{ __html: getPreviewHtml(body) }}
                    />
                  </div>
                )}
              </div>

              {/* OUTLOOK EMAIL SIGNATURE SECTION */}
              <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-crm-navy text-xs">
                    <input
                      type="checkbox"
                      checked={smtpConfig.includeSignature}
                      onChange={(e) => setSmtpConfig(prev => ({ ...prev, includeSignature: e.target.checked }))}
                      className="rounded text-crm-navy focus:ring-crm-navy/20 w-4 h-4"
                    />
                    <Sparkles className="w-4 h-4 text-crm-lime" />
                    Automatically Append Outlook / Email Signature
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateOutlookSignature}
                      disabled={generatingSignature}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-700 font-extrabold text-[11px] rounded-lg border border-blue-200 shadow-2xs flex items-center gap-1 transition-all"
                    >
                      <RefreshCw className={`w-3 h-3 ${generatingSignature ? 'animate-spin' : ''}`} />
                      Auto-Generate from Outlook
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSignatureEditor(prev => !prev)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-lg border border-slate-200 shadow-2xs transition-colors"
                    >
                      {showSignatureEditor ? 'Hide Signature Code' : 'Edit Signature'}
                    </button>
                  </div>
                </div>

                {smtpConfig.includeSignature && (
                  <div className="space-y-2 animate-in fade-in duration-150">
                    {/* Live Signature Rendered Card */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 mb-1">Attached Email Signature:</div>
                      {smtpConfig.signature ? (
                        <div
                          className="text-xs"
                          dangerouslySetInnerHTML={{ __html: smtpConfig.signature }}
                        />
                      ) : (
                        <div className="text-xs text-slate-500 italic flex items-center justify-between">
                          <span>No signature saved yet. Click "Auto-Generate from Outlook" or "Edit Signature" to create one.</span>
                        </div>
                      )}
                    </div>

                    {/* Signature Editor Textarea */}
                    {showSignatureEditor && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <label className="block text-[11px] font-bold text-slate-700">
                          Custom HTML / Text Signature Code:
                        </label>
                        <textarea
                          rows={4}
                          value={smtpConfig.signature}
                          onChange={(e) => setSmtpConfig(prev => ({ ...prev, signature: e.target.value }))}
                          placeholder="<p>Best regards,<br/><b>Your Name</b> | Company</p>"
                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                        />
                        <p className="text-[10px] text-slate-500">
                          Supports custom HTML formatting, images, telephone links, and styling.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* AUTOMATED MULTIPLE FOLLOW-UP EMAILS SECTION */}
              <div className="p-4 bg-gradient-to-r from-blue-50/80 via-slate-50 to-blue-50/80 border border-blue-200/80 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-crm-navy text-xs">
                    <input
                      type="checkbox"
                      checked={followUpEnabled}
                      onChange={(e) => setFollowUpEnabled(e.target.checked)}
                      className="rounded text-crm-navy focus:ring-crm-navy/20 w-4 h-4"
                    />
                    <Clock className="w-4 h-4 text-blue-600" />
                    Schedule Multiple Automated Follow-Up Emails
                  </label>
                  {followUpEnabled && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-blue-600 text-white rounded-full">
                      {followUps.length} Follow-up Step(s) Configured
                    </span>
                  )}
                </div>

                {followUpEnabled && (
                  <div className="space-y-4 pt-2 border-t border-blue-100 animate-in fade-in duration-200">
                    
                    {/* Render Each Follow-Up Step Card */}
                    {followUps.map((fu, index) => (
                      <div key={fu.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 relative">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-black text-xs text-crm-navy flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-crm-navy text-white flex items-center justify-center text-[10px]">
                              {index + 1}
                            </span>
                            Follow-Up Email #{index + 1}
                          </span>
                          
                          {followUps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFollowUpStep(fu.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove Step
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 mb-1">
                              When should Follow-Up #{index + 1} be sent?
                            </label>
                            <select
                              value={fu.delayDays}
                              onChange={(e) => updateFollowUpStep(fu.id, 'delayDays', e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                            >
                              <option value="1">1 Day After Initial Email</option>
                              <option value="2">2 Days After Initial Email</option>
                              <option value="3">3 Days After Initial Email</option>
                              <option value="5">5 Days After Initial Email</option>
                              <option value="7">7 Days After Initial Email</option>
                              <option value="14">14 Days After Initial Email</option>
                              <option value="custom">Custom Date & Time</option>
                            </select>
                          </div>

                          {fu.delayDays === 'custom' && (
                            <div>
                              <label className="block font-bold text-slate-700 mb-1">
                                Set Custom Date & Time
                              </label>
                              <input
                                type="datetime-local"
                                value={fu.customDate}
                                onChange={(e) => updateFollowUpStep(fu.id, 'customDate', e.target.value)}
                                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                              />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700">
                              Follow-Up #{index + 1} Subject Line *
                            </label>
                            <div className="flex gap-1">
                              {headers.slice(0, 3).map(h => (
                                <button
                                  key={h.key}
                                  type="button"
                                  onClick={() => insertVariableToFollowUp(fu.id, 'subject', h.key)}
                                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono"
                                >
                                  +{h.key}
                                </button>
                              ))}
                            </div>
                          </div>
                          <input
                            type="text"
                            value={fu.subject}
                            onChange={(e) => updateFollowUpStep(fu.id, 'subject', e.target.value)}
                            placeholder={`e.g. Following up on my previous message to {{Name}}`}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-bold text-slate-700">
                              Follow-Up #{index + 1} Body Content *
                            </label>
                            <div className="flex gap-1">
                              {headers.slice(0, 4).map(h => (
                                <button
                                  key={h.key}
                                  type="button"
                                  onClick={() => insertVariableToFollowUp(fu.id, 'body', h.key)}
                                  className="text-[10px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono"
                                >
                                  +{h.key}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            rows={3}
                            value={fu.body}
                            onChange={(e) => updateFollowUpStep(fu.id, 'body', e.target.value)}
                            placeholder={`Hi {{Name}},\n\nJust following up on my email regarding your inquiry. Looking forward to hearing from you!\n\nBest regards,\nCRM Team`}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add Another Follow-up Step Button */}
                    <button
                      type="button"
                      onClick={addFollowUpStep}
                      className="w-full py-2.5 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50 text-blue-700 font-extrabold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Plus className="w-4 h-4" />
                      + Add Another Follow-Up Email Step (Step #{followUps.length + 1})
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SMTP & OUTLOOK CONFIGURATION */}
          {activeTab === 'smtp' && (
            <div className="space-y-4">
              
              {/* Auth Mode Radio Selector */}
              <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-2 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => handleAuthTypeChange('password')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    smtpConfig.authType === 'password'
                      ? 'bg-white text-crm-navy shadow-xs font-black'
                      : 'text-slate-600 hover:text-crm-navy'
                  }`}
                >
                  <Server className="w-4 h-4 text-blue-600" />
                  Standard SMTP Password / App Password
                </button>

                <button
                  type="button"
                  onClick={() => handleAuthTypeChange('oauth2')}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                    smtpConfig.authType === 'oauth2'
                      ? 'bg-white text-crm-navy shadow-xs font-black'
                      : 'text-slate-600 hover:text-crm-navy'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  Azure AD OAuth2 (Client ID & Secret)
                </button>
              </div>

              {/* STANDARD SMTP PASSWORD MODE */}
              {smtpConfig.authType === 'password' ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-blue-900">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] space-y-1">
                      <p className="font-bold">Connect Outlook, Gmail, Yahoo, Zoho, or cPanel using your Email & Password.</p>
                      <p className="text-slate-600">
                        For <strong>Outlook / Office 365</strong>, click the <strong>Outlook / Office365</strong> preset button below!
                      </p>
                    </div>
                  </div>

                  {/* Quick Provider Presets */}
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-500">Quick Presets:</span>
                    <button
                      type="button"
                      onClick={() => setSmtpConfig(prev => ({ ...prev, host: 'smtp.office365.com', port: 587, secure: false }))}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-2xs flex items-center gap-1"
                    >
                      <Server className="w-3 h-3" />
                      Outlook / Office365 (smtp.office365.com)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmtpConfig(prev => ({ ...prev, host: 'smtp.gmail.com', port: 587, secure: false }))}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold rounded-lg border border-rose-200 text-xs transition-colors"
                    >
                      Gmail
                    </button>
                    <button
                      type="button"
                      onClick={() => setSmtpConfig(prev => ({ ...prev, host: 'smtp.mail.yahoo.com', port: 465, secure: true }))}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold rounded-lg border border-purple-200 text-xs transition-colors"
                    >
                      Yahoo
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Host Server * <span className="text-[10px] text-slate-400 font-normal">(e.g. smtp.office365.com)</span>
                      </label>
                      <input
                        type="text"
                        name="host"
                        value={smtpConfig.host}
                        onChange={handleSmtpChange}
                        placeholder="smtp.office365.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-crm-navy/20"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Port *</label>
                      <input
                        type="number"
                        name="port"
                        value={smtpConfig.port}
                        onChange={handleSmtpChange}
                        placeholder="587"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">User Email / Business Email *</label>
                      <input
                        type="email"
                        name="user"
                        value={smtpConfig.user}
                        onChange={handleSmtpChange}
                        placeholder="e.g. bde@tarasaka.com or user@outlook.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Password / App Password *</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="pass"
                          value={smtpConfig.pass}
                          onChange={handleSmtpChange}
                          placeholder="••••••••••••••••"
                          className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Sender Name (Optional)</label>
                      <input
                        type="text"
                        name="fromName"
                        value={smtpConfig.fromName}
                        onChange={handleSmtpChange}
                        placeholder="Sales Team"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                        <input
                          type="checkbox"
                          name="secure"
                          checked={smtpConfig.secure}
                          onChange={handleSmtpChange}
                          className="rounded text-crm-navy focus:ring-crm-navy/20"
                        />
                        Use SSL (Port 465)
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                /* OUTLOOK AZURE AD OAUTH2 MODE */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2 text-blue-900">
                    <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] space-y-1">
                      <p className="font-bold">Connect Microsoft Azure AD App Registration Credentials (OAuth2)</p>
                      <p className="text-slate-600">
                        Enter your <strong>Application (Client) ID</strong>, <strong>Client Secret</strong>, and <strong>Directory (Tenant) ID</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">User Email / Business Email *</label>
                      <input
                        type="email"
                        name="user"
                        value={smtpConfig.user}
                        onChange={handleSmtpChange}
                        placeholder="e.g. bde@tarasaka.com or user@outlook.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Application (Client) ID *</label>
                      <input
                        type="text"
                        name="clientId"
                        value={smtpConfig.clientId}
                        onChange={handleSmtpChange}
                        placeholder="2aed44ce-ff63-4e69-808f-75357d5fafe3"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Client Secret *</label>
                      <div className="relative">
                        <input
                          type={showClientSecret ? "text" : "password"}
                          name="clientSecret"
                          value={smtpConfig.clientSecret || smtpConfig.pass}
                          onChange={(e) => {
                            handleSmtpChange(e);
                            setSmtpConfig(prev => ({ ...prev, clientSecret: e.target.value }));
                          }}
                          placeholder="••••••••••••••••"
                          className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowClientSecret(!showClientSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        >
                          {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Directory (Tenant) ID *</label>
                      <input
                        type="text"
                        name="tenantId"
                        value={smtpConfig.tenantId}
                        onChange={handleSmtpChange}
                        placeholder="e3dbd6df-1f69-4e05-897a-733622f8e8ad"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-crm-navy"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Refresh Token (Optional)</label>
                      <div className="relative">
                        <input
                          type={showRefreshToken ? "text" : "password"}
                          name="refreshToken"
                          value={smtpConfig.refreshToken}
                          onChange={handleSmtpChange}
                          placeholder="OAuth2 Refresh Token (Optional)"
                          className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRefreshToken(!showRefreshToken)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        >
                          {showRefreshToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Sender Display Name (Optional)</label>
                      <input
                        type="text"
                        name="fromName"
                        value={smtpConfig.fromName}
                        onChange={handleSmtpChange}
                        placeholder="Sales Team"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Redirect URI Guidance for AADSTS500113 Fix */}
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-amber-900 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        OAuth Redirect URI / Reply URL (Required in Azure Portal)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const uri = window.location.origin + '/auth/outlook/callback';
                          navigator.clipboard.writeText(uri);
                          showSuccess('Redirect URI copied to clipboard!');
                        }}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg text-[10px] transition-colors shrink-0"
                      >
                        Copy Redirect URI
                      </button>
                    </div>
                    <div className="font-mono bg-white p-1.5 rounded border border-amber-200 text-slate-800 text-[11px] font-bold overflow-x-auto">
                      {window.location.origin}/auth/outlook/callback
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                    <div className="text-[11px] text-slate-600 font-medium">
                      {smtpConfig.refreshToken ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Microsoft Refresh Token Saved
                        </span>
                      ) : (
                        <span>Connect to Microsoft to get Access & Refresh tokens</span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleConnectOutlook}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Connect Outlook (Microsoft Sign-In)
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons for SMTP / Outlook */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 text-xs">
                  <input
                    type="checkbox"
                    checked={saveSmtp}
                    onChange={(e) => setSaveSmtp(e.target.checked)}
                    className="rounded text-crm-navy focus:ring-crm-navy/20"
                  />
                  Save Account credentials to my profile
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestSmtp}
                    disabled={testingSmtp}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-crm-navy font-bold rounded-xl transition-colors"
                  >
                    {testingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
                    Test Connection
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSmtp}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Credentials
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESULTS & STATUS REPORT */}
          {activeTab === 'results' && sendResults && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-sm">Email Processing Completed</h4>
                    <p className="text-xs text-emerald-700">{sendResults.message}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-right">
                  <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-xl text-xs">
                    {sendResults.totalSent} Sent (5-10s Delay)
                  </span>
                  {sendResults.totalFollowUpsScheduled > 0 && (
                    <span className="px-3 py-1 bg-blue-600 text-white font-extrabold rounded-xl text-xs">
                      {sendResults.totalFollowUpsScheduled} Follow-up(s) Scheduled
                    </span>
                  )}
                  {sendResults.totalFailed > 0 && (
                    <span className="px-3 py-1 bg-rose-600 text-white font-extrabold rounded-xl text-xs">
                      {sendResults.totalFailed} Failed
                    </span>
                  )}
                </div>
              </div>

              {sendResults.failedRecipients && sendResults.failedRecipients.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-extrabold text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Undelivered / Failed Addresses ({sendResults.failedRecipients.length})
                  </h5>
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-white">
                    {sendResults.failedRecipients.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">{item.email}</span>
                        <span className="text-rose-600 font-semibold">{item.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-3">
            {activeTab === 'smtp' ? (
              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-crm-navy font-extrabold text-xs rounded-xl transition-colors"
              >
                Back to Template
              </button>
            ) : activeTab === 'template' ? (
              <button
                type="button"
                onClick={() => setActiveTab('smtp')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
              >
                Configure Connection / Outlook
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('template')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-colors"
              >
                Send Another Batch
              </button>
            )}

            {activeTab !== 'results' ? (
              <button
                type="button"
                onClick={handleSendEmails}
                disabled={sending}
                className="flex items-center gap-2 px-5 py-2.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy font-black text-xs rounded-xl shadow-md transition-all"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Mails (5-10s Delay)...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Emails Now
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Done
              </button>
            )}
          </div>
        </div>

      </div>

      {/* DEEPSEEK AI SEQUENCE GENERATOR MODAL (TOP LEVEL OVERLAY - NO OVERLAP) */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-purple-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 relative z-10">
            
            {/* AI Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-md border border-purple-400/30">
                  <Sparkles className="w-5 h-5 text-crm-lime animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base tracking-tight text-white">
                      AI Email & Follow-Up Sequence Architect
                    </h3>
                    <span className="px-2 py-0.5 bg-purple-500/30 border border-purple-400/40 text-crm-lime text-[10px] font-mono font-black rounded-full">
                      {aiModel}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80">
                    DeepSeek AI analyzes your dataset columns and crafts personalized cold outreach sequences.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              
              {/* Model & API Key Status */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-700" />
                    <span className="font-bold text-purple-950">AI Model Engine:</span>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="px-2.5 py-1 text-xs font-black bg-white rounded-lg border border-purple-200 text-purple-900 focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash (⚡ Google Gemini - Fast) [Recommended]</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (🧠 Google Gemini - Deep Reasoning)</option>
                      <option value="deepseek-ai/deepseek-v4-pro-0813">deepseek-ai/deepseek-v4-pro-0813 (NVIDIA NIM)</option>
                      <option value="deepseek-chat">deepseek-chat (Official DeepSeek V3)</option>
                      <option value="deepseek-reasoner">deepseek-reasoner (DeepSeek R1 Reasoning)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasDeepseekKey ? (
                      <span className="text-emerald-700 font-extrabold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Key Configured
                      </span>
                    ) : (
                      <span className="text-amber-700 font-extrabold text-[11px] flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Key Missing
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAiKeyInput(!showAiKeyInput)}
                      className="text-[11px] font-bold text-purple-700 hover:underline"
                    >
                      {showAiKeyInput ? 'Hide Key' : 'Configure Key'}
                    </button>
                  </div>
                </div>

                {showAiKeyInput && (
                  <div className="pt-2 border-t border-purple-200/60 flex items-center gap-2 animate-in fade-in">
                    <input
                      type="password"
                      autoComplete="off"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                      placeholder="Paste your DeepSeek / NVIDIA API Key here..."
                      className="flex-1 px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSaveDeepseekKey}
                      disabled={savingAiKey}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
                    >
                      {savingAiKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Key'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step 1: Goal & Objective Selection */}
              <div>
                <label className="block font-black text-slate-800 mb-1.5 text-xs">
                  1. Campaign Objective / Pitch Goal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'Cold Pitch & Value Prop', label: 'Cold Pitch & Value Prop', icon: '🚀' },
                    { id: 'Book Demo / Call', label: 'Book Demo / Call', icon: '📅' },
                    { id: 'Service Proposal', label: 'Service Proposal', icon: '💼' },
                    { id: 'Limited-Time Offer', label: 'Limited-Time Offer', icon: '🔥' },
                    { id: 'Partnership', label: 'Partnership', icon: '🤝' },
                    { id: 'Winback / Re-engage', label: 'Winback / Re-engage', icon: '🔄' }
                  ].map(g => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setAiGoal(g.id)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all flex items-center gap-2 ${
                        aiGoal === g.id
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-300'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm">{g.icon}</span>
                      <span className="truncate text-xs">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2 & 3: Tone and Follow-Up Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 mb-1.5 text-xs">
                    2. Tone of Voice
                  </label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-400 text-xs"
                  >
                    <option value="Professional & Conversational">👔 Professional & Conversational (Tarasaka Standard)</option>
                    <option value="Persuasive & High Converting">🎯 Persuasive & High Converting</option>
                    <option value="Friendly & Helpful">😊 Friendly & Helpful</option>
                    <option value="Urgent & Action-Oriented">⚡ Urgent & Action-Oriented</option>
                    <option value="Casual & Relatable">☕ Casual & Relatable</option>
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 mb-1.5 text-xs">
                    3. Number of Follow-Up Steps
                  </label>
                  <select
                    value={aiFollowUpCount}
                    onChange={(e) => setAiFollowUpCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-400 text-xs"
                  >
                    <option value={1}>1 Follow-Up Email (Day 2 Nudge)</option>
                    <option value={2}>2 Follow-Up Emails (Day 2 Nudge + Day 5 Quick Insight)</option>
                    <option value={3}>3 Follow-Up Emails (Day 2 Nudge + Day 5 Insight + Day 7 Polite Close)</option>
                    <option value={4}>4 Follow-Up Emails (Full Multi-Touch Sequence)</option>
                  </select>
                </div>
              </div>

              {/* Step 4: Offer Details */}
              <div>
                <label className="block font-black text-slate-800 mb-1 text-xs">
                  4. Your Offer / Core Value Proposition
                </label>
                <input
                  type="text"
                  value={aiOfferDescription}
                  onChange={(e) => setAiOfferDescription(e.target.value)}
                  placeholder="e.g. Tarasaka Digital Solutions - Web development, workflow automation & custom software systems..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-400 text-xs"
                />
              </div>

              {/* Step 5: Custom Instructions */}
              <div>
                <label className="block font-black text-slate-800 mb-1 text-xs">
                  5. Additional Custom Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={aiCustomPrompt}
                  onChange={(e) => setAiCustomPrompt(e.target.value)}
                  placeholder="e.g. Mention our free 15-minute website audit and include an offer for {{city}} businesses..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-400 text-xs resize-none"
                />
              </div>

              {/* Step 6: Dataset Personalization Tags preview */}
              {headers && headers.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <div className="text-[11px] font-extrabold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Available Dynamic Merge Tags for Personalization:
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {headers.map(h => (
                      <span
                        key={h.key}
                        className="px-2 py-0.5 bg-white border border-purple-200 text-purple-800 font-mono text-[10px] font-bold rounded-md shadow-2xs"
                      >
                        {`{{${h.key}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated AI Sequence Preview Tabs */}
              {generatedAiSequence && (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-300/80 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-purple-950 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Generated AI Outreach Sequence (Editable)
                    </span>
                    <span className="text-[10px] font-mono text-purple-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-purple-200 font-bold shadow-2xs">
                      1 Initial + {generatedAiSequence.followUps?.length || 0} Follow-Ups
                    </span>
                  </div>

                  {/* Tabs */}
                  <div className="flex items-center gap-1.5 border-b border-purple-200/80 pb-2 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setAiPreviewTab('initial')}
                      className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                        aiPreviewTab === 'initial'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-purple-100/60'
                      }`}
                    >
                      ✉️ Initial Email
                    </button>
                    {(generatedAiSequence.followUps || []).map((f, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAiPreviewTab(`followup-${i}`)}
                        className={`px-3 py-1 text-xs font-black rounded-lg transition-all ${
                          aiPreviewTab === `followup-${i}`
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-purple-100/60'
                        }`}
                      >
                        {`🔄 Follow-Up #${i + 1} (+${f.delayDays}d)`}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  {aiPreviewTab === 'initial' ? (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            <span>SUBJECT LINE</span>
                          </label>
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                            ✏️ Editable
                          </span>
                        </div>
                        <input
                          type="text"
                          value={generatedAiSequence.initialEmail?.subject || ''}
                          onChange={(e) => handleUpdateAiInitial('subject', e.target.value)}
                          placeholder="Email subject line..."
                          className="w-full px-3.5 py-2 font-mono text-xs font-bold text-slate-900 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all shadow-2xs"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            <span>EMAIL BODY</span>
                          </label>
                          <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                            ✏️ Edit text or merge tags
                          </span>
                        </div>
                        <textarea
                          rows={8}
                          value={generatedAiSequence.initialEmail?.body || ''}
                          onChange={(e) => handleUpdateAiInitial('body', e.target.value)}
                          placeholder="Type or edit email body message..."
                          className="w-full p-3.5 text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-y transition-all shadow-2xs"
                        />
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const idx = parseInt(aiPreviewTab.replace('followup-', ''), 10);
                      const f = generatedAiSequence.followUps[idx];
                      if (!f) return null;
                      return (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-purple-200 shadow-xs">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider">
                              Follow-Up #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-semibold text-slate-600">Send after:</span>
                              <input
                                type="number"
                                min="1"
                                max="60"
                                value={f.delayDays || ''}
                                onChange={(e) => handleUpdateAiFollowUp(idx, 'delayDays', e.target.value)}
                                className="w-12 px-1.5 py-0.5 text-center text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 rounded-md focus:ring-1 focus:ring-purple-400 outline-none"
                              />
                              <span className="text-[11px] font-semibold text-slate-600">days of no reply</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                                SUBJECT LINE
                              </label>
                              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                                ✏️ Editable
                              </span>
                            </div>
                            <input
                              type="text"
                              value={f.subject || ''}
                              onChange={(e) => handleUpdateAiFollowUp(idx, 'subject', e.target.value)}
                              placeholder="Follow-up subject line..."
                              className="w-full px-3.5 py-2 font-mono text-xs font-bold text-slate-900 bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all shadow-2xs"
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                                EMAIL BODY
                              </label>
                              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                                ✏️ Edit text or merge tags
                              </span>
                            </div>
                            <textarea
                              rows={8}
                              value={f.body || ''}
                              onChange={(e) => handleUpdateAiFollowUp(idx, 'body', e.target.value)}
                              placeholder="Follow-up email body..."
                              className="w-full p-3.5 text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/70 hover:bg-white focus:bg-white rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-y transition-all shadow-2xs"
                            />
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

            </div>

            {/* AI Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAiSequence}
                  disabled={generatingAi}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {generatingAi ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Writing with {aiModel}...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-crm-lime" />
                      {generatedAiSequence ? 'Regenerate Variation' : 'Generate Sequence'}
                    </>
                  )}
                </button>

                {generatedAiSequence && (
                  <button
                    type="button"
                    onClick={handleApplyAiSequence}
                    className="px-5 py-2.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 animate-in zoom-in-95"
                  >
                    <Check className="w-4 h-4" />
                    Apply to Email Campaign
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
