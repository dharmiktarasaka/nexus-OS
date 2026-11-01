import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, User, Mail, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle, KeyRound, Server, Loader2, Save, Trash2, Eye, EyeOff, Check, Zap, Info, Sparkles, Target, ExternalLink, RefreshCw, ArrowRight, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { ChangePasswordModal } from '../components/ChangePasswordModal';

export const Settings = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Email / Outlook Connection State
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
    fromName: ''
  });

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, message: string } | null
  const [showPassword, setShowPassword] = useState(false);

  // TinyFish Free AI Lead Scraper API State
  const [tinyfishKey, setTinyfishKey] = useState('');
  const [hasTinyfishKey, setHasTinyfishKey] = useState(false);
  const [isEnvTinyfishKey, setIsEnvTinyfishKey] = useState(false);
  const [showTinyfishKey, setShowTinyfishKey] = useState(false);
  const [testingTinyfish, setTestingTinyfish] = useState(false);
  const [savingTinyfish, setSavingTinyfish] = useState(false);
  const [tinyfishResult, setTinyfishResult] = useState(null);

  const [deepseekKey, setDeepseekKey] = useState('');
  const [deepseekModel, setDeepseekModel] = useState('deepseek-ai/deepseek-v4-pro-0813');
  const [hasDeepseekKey, setHasDeepseekKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [testingDeepseek, setTestingDeepseek] = useState(false);
  const [savingDeepseek, setSavingDeepseek] = useState(false);
  const [deepseekResult, setDeepseekResult] = useState(null);

  // Google Gemini & Active AI Provider State
  const [activeAiProvider, setActiveAiProvider] = useState('gemini'); // 'gemini' | 'deepseek'
  const [geminiKey, setGeminiKey] = useState('');
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [savingGemini, setSavingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState(null);

  // LinkedIn Integration State
  const [hasLinkedin, setHasLinkedin] = useState(false);
  const [linkedinProfile, setLinkedinProfile] = useState(null);
  const [linkedinClientId, setLinkedinClientId] = useState('');
  const [linkedinClientSecret, setLinkedinClientSecret] = useState('');
  const [showLinkedinSecret, setShowLinkedinSecret] = useState(false);
  const [savingLinkedin, setSavingLinkedin] = useState(false);
  const [testingLinkedin, setTestingLinkedin] = useState(false);
  const [linkedinResult, setLinkedinResult] = useState(null);

  // Discord Integration State
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [discordBotToken, setDiscordBotToken] = useState('');
  const [showDiscordToken, setShowDiscordToken] = useState(false);
  const [hasDiscordConfig, setHasDiscordConfig] = useState(false);
  const [savingDiscord, setSavingDiscord] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);
  const [discordResult, setDiscordResult] = useState(null);

  useEffect(() => {
    fetchSmtpConfig();
    fetchTinyfishConfig();
    fetchAiConfig();
    fetchLinkedinConfig();
    fetchDiscordConfig();
  }, []);

  const fetchDiscordConfig = async () => {
    try {
      const res = await api.get('/lead-grab/discord-config');
      if (res.data?.success) {
        setHasDiscordConfig(res.data.hasWebhook || res.data.hasBotToken);
        setDiscordWebhookUrl(res.data.webhookUrl || '');
        setDiscordBotToken(res.data.botToken || '');
      }
    } catch (e) {}
  };

  const handleSaveDiscordConfig = async () => {
    setSavingDiscord(true);
    setDiscordResult(null);
    try {
      const res = await api.post('/lead-grab/discord-config', {
        webhookUrl: discordWebhookUrl.trim(),
        botToken: discordBotToken.trim()
      });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setHasDiscordConfig(Boolean(discordWebhookUrl.trim() || discordBotToken.trim()));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save Discord config');
    } finally {
      setSavingDiscord(false);
    }
  };

  const handleTestDiscordWebhook = async () => {
    if (!discordWebhookUrl.trim()) {
      showError('Please enter a Discord Webhook URL first');
      return;
    }
    setTestingDiscord(true);
    setDiscordResult(null);
    try {
      const res = await api.post('/lead-grab/test-discord-webhook', { webhookUrl: discordWebhookUrl.trim() });
      if (res.data?.success) {
        setDiscordResult({ success: true, message: res.data.message });
        showSuccess(res.data.message);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send Discord webhook test message';
      setDiscordResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setTestingDiscord(false);
    }
  };

  const fetchLinkedinConfig = async () => {
    try {
      const res = await api.get('/linkedin/status');
      if (res.data?.success) {
        setHasLinkedin(res.data.isConnected);
        setLinkedinProfile(res.data.profile);
        setLinkedinClientId(res.data.clientId || '');
      }
    } catch (e) {}
  };

  const fetchTinyfishConfig = async () => {
    try {
      const res = await api.get('/lead-grab/tinyfish-key');
      if (res.data?.success) {
        setHasTinyfishKey(res.data.hasKey);
        setIsEnvTinyfishKey(res.data.isEnvKey);
        setTinyfishKey(res.data.rawKey || '');
      }
    } catch (e) {}
  };

  const handleSaveTinyfishKey = async () => {
    setSavingTinyfish(true);
    setTinyfishResult(null);
    try {
      const res = await api.post('/lead-grab/tinyfish-key', { apiKey: tinyfishKey });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setHasTinyfishKey(Boolean(tinyfishKey.trim()));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save TinyFish API Key');
    } finally {
      setSavingTinyfish(false);
    }
  };

  const handleTestTinyfishKey = async () => {
    if (!tinyfishKey.trim()) {
      showError('Please enter a TinyFish API Key first');
      return;
    }
    setTestingTinyfish(true);
    setTinyfishResult(null);
    try {
      const res = await api.post('/lead-grab/test-tinyfish', { apiKey: tinyfishKey });
      if (res.data?.success) {
        setTinyfishResult({ success: true, message: res.data.message });
        showSuccess(res.data.message);
        setHasTinyfishKey(true);
      }
    } catch (err) {
      const rawMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'TinyFish verification failed. Please check your API key.';
      const msg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
      setTinyfishResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setTestingTinyfish(false);
    }
  };

  const fetchAiConfig = async () => {
    try {
      const res = await api.get('/lead-grab/ai-config');
      if (res.data?.success) {
        setHasDeepseekKey(res.data.hasDeepseekKey);
        setDeepseekModel(res.data.deepseekModel || 'deepseek-ai/deepseek-v4-pro-0813');
        setDeepseekKey(res.data.deepseekApiKey || '');

        setHasGeminiKey(res.data.hasGeminiKey);
        setGeminiModel(res.data.geminiModel || 'gemini-2.5-flash');
        setGeminiKey(res.data.geminiApiKey || '');

        setActiveAiProvider(res.data.activeAiProvider || (res.data.hasGeminiKey ? 'gemini' : 'deepseek'));
      }
    } catch (e) {}
  };

  const handleSaveAiConfig = async (providerOverride) => {
    const prov = providerOverride || activeAiProvider;
    setSavingDeepseek(true);
    setSavingGemini(true);
    try {
      const res = await api.post('/lead-grab/save-ai-config', {
        deepseekApiKey: deepseekKey,
        deepseekModel,
        geminiApiKey: geminiKey,
        geminiModel,
        activeAiProvider: prov
      });
      if (res.data?.success) {
        showSuccess(res.data.message || 'AI Settings saved successfully!');
        setHasDeepseekKey(Boolean(deepseekKey.trim()));
        setHasGeminiKey(Boolean(geminiKey.trim()));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save AI settings');
    } finally {
      setSavingDeepseek(false);
      setSavingGemini(false);
    }
  };

  const handleTestGeminiKey = async () => {
    if (!geminiKey.trim()) {
      showError('Please enter a Google Gemini API key first');
      return;
    }
    setTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await api.post('/lead-grab/test-gemini', {
        apiKey: geminiKey,
        model: geminiModel
      });
      if (res.data?.success) {
        setGeminiResult({ success: true, message: res.data.message });
        showSuccess(res.data.message);
        setHasGeminiKey(true);
        setActiveAiProvider('gemini');
        if (res.data?.model) {
          setGeminiModel(res.data.model);
        }
      } else {
        const msg = res.data?.message || 'Google Gemini verification failed.';
        setGeminiResult({ success: false, message: msg });
        showError(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google Gemini verification failed.';
      setGeminiResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestDeepseekKey = async () => {
    if (!deepseekKey.trim()) {
      showError('Please enter a DeepSeek API key first');
      return;
    }
    setTestingDeepseek(true);
    setDeepseekResult(null);
    try {
      const res = await api.post('/lead-grab/test-deepseek', {
        apiKey: deepseekKey,
        model: deepseekModel
      });
      if (res.data?.success) {
        setDeepseekResult({ success: true, message: res.data.message });
        showSuccess(res.data.message);
        setHasDeepseekKey(true);
        setActiveAiProvider('deepseek');
        if (res.data?.model) {
          setDeepseekModel(res.data.model);
        }
      } else {
        const msg = res.data?.message || 'DeepSeek verification failed. Please check your API key.';
        setDeepseekResult({ success: false, message: msg });
        showError(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'DeepSeek verification failed. Please check your API key.';
      setDeepseekResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setTestingDeepseek(false);
    }
  };

  const handleConnectLinkedin = async () => {
    if (!linkedinClientId.trim()) {
      showError('Please enter your LinkedIn Developer Client ID');
      return;
    }
    if (!linkedinClientSecret.trim()) {
      showError('Please enter your LinkedIn Client Secret');
      return;
    }

    try {
      sessionStorage.setItem('linkedin_auth_config', JSON.stringify({
        clientId: linkedinClientId.trim(),
        clientSecret: linkedinClientSecret.trim()
      }));

      const redirectUri = window.location.origin + '/auth/linkedin/callback';
      const res = await api.get(`/linkedin/auth-url?clientId=${encodeURIComponent(linkedinClientId.trim())}&redirectUri=${encodeURIComponent(redirectUri)}`);

      if (res.data?.success && res.data.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        showError('Failed to generate LinkedIn Authorization URL');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to initiate LinkedIn OAuth connection');
    }
  };

  const handleDisconnectLinkedin = async () => {
    try {
      const res = await api.post('/linkedin/disconnect');
      if (res.data?.success) {
        showSuccess('LinkedIn account disconnected successfully');
        setHasLinkedin(false);
        setLinkedinProfile(null);
        setLinkedinResult(null);
      }
    } catch (err) {
      showError('Failed to disconnect LinkedIn account');
    }
  };

  const handleTestLinkedinSearch = async () => {
    setTestingLinkedin(true);
    setLinkedinResult(null);
    try {
      const res = await api.post('/linkedin/search-leads', {
        niche: 'Real Estate Agencies',
        targetCity: 'New York',
        targetCount: 5
      });
      if (res.data?.success) {
        const msg = `Found ${res.data.count} verified LinkedIn decision makers!`;
        setLinkedinResult({ success: true, message: msg });
        showSuccess(msg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'LinkedIn lead search test failed';
      setLinkedinResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setTestingLinkedin(false);
    }
  };

  const fetchOutscraperConfig = async () => {
    try {
      const res = await api.get('/lead-grab/api-key');
      if (res.data?.success) {
        setHasOutscraperKey(res.data.hasKey);
        setIsEnvKey(res.data.isEnvKey);
        setOutscraperKey(res.data.rawKey || '');
      }
    } catch (e) {}
  };

  const handleSaveOutscraperKey = async () => {
    setSavingOutscraper(true);
    setOutscraperResult(null);
    try {
      const res = await api.post('/lead-grab/api-key', { apiKey: outscraperKey });
      if (res.data?.success) {
        showSuccess(res.data.message);
        setHasOutscraperKey(Boolean(outscraperKey.trim()));
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save Outscraper API Key');
    } finally {
      setSavingOutscraper(false);
    }
  };

  const handleTestOutscraperKey = async () => {
    if (!outscraperKey.trim()) {
      showError('Please enter an Outscraper API Key first');
      return;
    }
    setTestingOutscraper(true);
    setOutscraperResult(null);
    try {
      const res = await api.post('/lead-grab/test-api-key', { apiKey: outscraperKey });
      if (res.data?.success) {
        setOutscraperResult({ success: true, message: res.data.message });
        showSuccess(res.data.message);
        setHasOutscraperKey(true);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Outscraper verification failed. Please check your API key.';
      setOutscraperResult({ success: false, message: msg });
      showError(msg);
    } finally {
      setTestingOutscraper(false);
    }
  };

  const fetchSmtpConfig = async () => {
    setLoadingConfig(true);
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
      // Ignore if no config saved yet
    } finally {
      setLoadingConfig(false);
    }
  };

  const applyPreset = (presetName) => {
    setTestResult(null);
    if (presetName === 'outlook') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        authType: 'password',
        clientId: '',
        tenantId: ''
      }));
    } else if (presetName === 'gmail') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        authType: 'password',
        clientId: '',
        tenantId: ''
      }));
    } else if (presetName === 'yahoo') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        authType: 'password',
        clientId: '',
        tenantId: ''
      }));
    } else if (presetName === 'zoho') {
      setSmtpConfig(prev => ({
        ...prev,
        host: 'smtp.zoho.com',
        port: 587,
        secure: false,
        authType: 'password',
        clientId: '',
        tenantId: ''
      }));
    } else if (presetName === 'custom') {
      setSmtpConfig(prev => ({
        ...prev,
        host: '',
        port: 587,
        secure: false,
        authType: 'password',
        clientId: '',
        tenantId: ''
      }));
    }
  };

  const handleSmtpChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSmtpConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setTestResult(null);
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
      // Save credentials to user profile so backend has full config
      const configToSave = {
        ...smtpConfig,
        authType: 'oauth2',
        clientId: cId,
        clientSecret: cSecret,
        pass: cSecret,
        tenantId: tId
      };
      await api.put('/users/smtp-config', configToSave);

      // Store in sessionStorage as fallback for callback page
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

  const handleTestConnection = async () => {
    if (smtpConfig.authType !== 'oauth2' && !smtpConfig.user) {
      showError('Please enter your Email address');
      return;
    }
    setTestingSmtp(true);
    setTestResult(null);
    try {
      const res = await api.post('/users/test-email-connection', smtpConfig);
      if (res.data?.success) {
        setTestResult({ success: true, message: res.data.message || 'Mail connection verified successfully!' });
        showSuccess(res.data.message || 'Mail connection verified successfully!');
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Mail Connection Test Failed';
      setTestResult({ success: false, message: errMsg });
      showError(errMsg);
    } finally {
      setTestingSmtp(false);
    }
  };

  const [generatingSignature, setGeneratingSignature] = useState(false);
  const [showSignatureCode, setShowSignatureCode] = useState(false);

  const handleGenerateSignature = async () => {
    setGeneratingSignature(true);
    try {
      const res = await api.post('/outlook/generate-signature', {
        displayName: smtpConfig.fromName || user?.name || '',
        jobTitle: smtpConfig.jobTitle || '',
        companyName: smtpConfig.companyName || '',
        email: smtpConfig.user || user?.email || '',
        phone: smtpConfig.phone || '',
        website: smtpConfig.website || ''
      });
      if (res.data?.success && res.data.signature) {
        setSmtpConfig(prev => ({
          ...prev,
          signature: res.data.signature,
          includeSignature: true
        }));
        showSuccess('Outlook signature generated from profile info!');
      }
    } catch (err) {
      showError('Failed to generate signature');
    } finally {
      setGeneratingSignature(false);
    }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const res = await api.put('/users/smtp-config', smtpConfig);
      if (res.data?.success) {
        showSuccess('Email, Outlook & signature settings saved to profile!');
      }
    } catch (err) {
      showError('Failed to save email settings');
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect and remove saved email credentials from your profile?')) return;
    try {
      const res = await api.delete('/users/smtp-config');
      if (res.data?.success) {
        setSmtpConfig({
          authType: 'password',
          host: 'smtp.office365.com',
          port: 587,
          secure: false,
          user: '',
          pass: '',
          clientId: '2aed44ce-ff63-4e69-808f-75357d5fafe3',
          clientSecret: '',
          tenantId: 'e3dbd6df-1f69-4e05-897a-733622f8e8ad',
          refreshToken: '',
          fromName: ''
        });
        setTestResult(null);
        showSuccess('Email account disconnected successfully');
      }
    } catch (err) {
      showError('Failed to disconnect email account');
    }
  };

  const isOutlook = smtpConfig.host?.toLowerCase().includes('office365') || smtpConfig.host?.toLowerCase().includes('outlook');
  const isConnected = Boolean(smtpConfig.user);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-extrabold text-crm-navy">CRM Application Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage user preferences, email & Outlook connections, and messaging parameters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Account Profile */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-slate-400" />
              User Profile Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Full Name</span>
                <span className="font-bold text-slate-800 text-sm">{user?.name}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-700">{user?.email}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Assigned Role</span>
                <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black uppercase bg-crm-lime text-crm-navy rounded-full">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-crm-navy bg-slate-100 hover:bg-crm-lime hover:text-crm-navy transition-all shadow-xs"
            >
              <KeyRound className="w-4 h-4 text-crm-navy" />
              <span>Reset / Change Password</span>
            </button>
          </div>
        </div>

        {/* Integration Services Architecture Status */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            Automation & Messaging Status
          </h3>

          <div className="space-y-3">
            {/* Email Integration Connection Status */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-crm-navy">Email & Outlook Connection</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {isConnected ? `${smtpConfig.user}` : 'Optional Email Integration Facility'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {isConnected ? (isOutlook ? '🟢 Outlook Connected' : '🔵 Custom SMTP Connected') : '⚪ Not Connected (Optional)'}
              </span>
            </div>

            {/* WhatsApp Integration Status */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-crm-navy">WhatsApp Gateway</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Optional Messaging Layer</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
                Ready for API Key
              </span>
            </div>

            {/* TinyFish Free AI Web Scraper Status */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-crm-lime/20 text-crm-navy rounded-lg">
                  <Sparkles className="w-4 h-4 text-crm-navy" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-crm-navy">TinyFish Free AI Web Scraper</h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {hasTinyfishKey ? '100% Real Phone Numbers, Emails & Leads Enabled' : 'Free AI Web Scraping & Lead Agent'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                hasTinyfishKey
                  ? 'bg-crm-lime/20 text-crm-navy border border-crm-lime/40'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {hasTinyfishKey ? '🟢 Active & Connected' : '⚪ Not Configured (Uses Puppeteer)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Outlook & Email SMTP Connection Facility Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Email Account & Outlook Connection (Optional Facility)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your Microsoft Outlook or Custom Email SMTP account to dispatch bulk emails and automated follow-ups.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold shrink-0 border border-blue-200/60">
            <Zap className="w-3.5 h-3.5" />
            Optional Connection
          </span>
        </div>

        {/* Quick Presets Bar */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Quick Email Presets:</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('outlook')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isOutlook
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              Outlook / Office365 (smtp.office365.com)
            </button>

            <button
              type="button"
              onClick={() => applyPreset('gmail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                smtpConfig.host === 'smtp.gmail.com'
                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Gmail
            </button>

            <button
              type="button"
              onClick={() => applyPreset('yahoo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                smtpConfig.host === 'smtp.mail.yahoo.com'
                  ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600/30'
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              Yahoo
            </button>

            <button
              type="button"
              onClick={() => applyPreset('zoho')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                smtpConfig.host === 'smtp.zoho.com'
                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Zoho
            </button>

            <button
              type="button"
              onClick={() => applyPreset('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                !isOutlook && !['smtp.gmail.com', 'smtp.mail.yahoo.com', 'smtp.zoho.com'].includes(smtpConfig.host)
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              Custom SMTP
            </button>
          </div>
        </div>

        {/* Auth Mode Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setSmtpConfig(prev => ({ ...prev, authType: 'password' }))}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              smtpConfig.authType === 'password'
                ? 'bg-white text-crm-navy shadow-xs font-black'
                : 'text-slate-600 hover:text-crm-navy'
            }`}
          >
            <Server className="w-4 h-4 text-blue-600" />
            Standard Email & Password / App Password
          </button>

          <button
            type="button"
            onClick={() => setSmtpConfig(prev => ({ ...prev, authType: 'oauth2' }))}
            className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-2 ${
              smtpConfig.authType === 'oauth2'
                ? 'bg-white text-crm-navy shadow-xs font-black'
                : 'text-slate-600 hover:text-crm-navy'
            }`}
          >
            <KeyRound className="w-4 h-4 text-blue-600" />
            Microsoft Azure AD OAuth2 (Connect Outlook)
          </button>
        </div>

        {/* Credentials Form */}
        {loadingConfig ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {smtpConfig.authType === 'password' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Host Server *</label>
                  <input
                    type="text"
                    name="host"
                    value={smtpConfig.host}
                    onChange={handleSmtpChange}
                    placeholder="e.g. smtp.office365.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Port *</label>
                  <input
                    type="number"
                    name="port"
                    value={smtpConfig.port}
                    onChange={handleSmtpChange}
                    placeholder="587"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">User Email / Business Email *</label>
                  <input
                    type="email"
                    name="user"
                    value={smtpConfig.user}
                    onChange={handleSmtpChange}
                    placeholder="e.g. bde@tarasaka.com or user@outlook.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password / App Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="pass"
                      autoComplete="off"
                      value={smtpConfig.pass}
                      onChange={handleSmtpChange}
                      placeholder="••••••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sender Name (Optional)</label>
                  <input
                    type="text"
                    name="fromName"
                    value={smtpConfig.fromName}
                    onChange={handleSmtpChange}
                    placeholder="e.g. Sales Team"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      name="secure"
                      checked={smtpConfig.secure}
                      onChange={handleSmtpChange}
                      className="rounded border-slate-300 text-crm-navy focus:ring-crm-navy"
                    />
                    <span>Use SSL (Port 465)</span>
                  </label>
                </div>
              </div>
            ) : (
              /* OAUTH2 MODE */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900 text-xs">
                  <KeyRound className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Microsoft Entra / Outlook OAuth 2.0 Authorization</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Enter your <strong>Application (Client) ID</strong> and <strong>Client Secret</strong>, then click <strong>Connect Outlook Account</strong> to sign in and authorize with Microsoft.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">User Email / Business Email *</label>
                    <input
                      type="email"
                      name="user"
                      value={smtpConfig.user}
                      onChange={handleSmtpChange}
                      placeholder="e.g. bde@tarasaka.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Application (Client) ID *</label>
                    <input
                      type="text"
                      name="clientId"
                      value={smtpConfig.clientId}
                      onChange={handleSmtpChange}
                      placeholder="e.g. 2aed44ce-ff63-4e69-808f-75357d5fafe3"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client Secret *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="clientSecret"
                        autoComplete="off"
                        value={smtpConfig.clientSecret || smtpConfig.pass}
                        onChange={(e) => {
                          handleSmtpChange(e);
                          setSmtpConfig(prev => ({ ...prev, clientSecret: e.target.value }));
                        }}
                        placeholder="••••••••••••••••"
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Directory (Tenant) ID (Optional)</label>
                    <input
                      type="text"
                      name="tenantId"
                      value={smtpConfig.tenantId}
                      onChange={handleSmtpChange}
                      placeholder="e.g. e3dbd6df-1f69-4e05-897a-733622f8e8ad or common"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Redirect URI Guidance for Azure Portal AADSTS500113 Fix */}
                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl space-y-2 text-xs">
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
                  <div className="font-mono bg-white p-2 rounded-lg border border-amber-200 text-slate-800 text-[11px] font-bold overflow-x-auto">
                    {window.location.origin}/auth/outlook/callback
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    <strong>To fix AADSTS500113 error:</strong> Open your app in <a href="https://portal.azure.com" target="_blank" rel="noreferrer" className="underline text-blue-600 font-bold">Azure Portal</a> &rarr; <strong>App Registrations</strong> &rarr; <strong>Authentication</strong> &rarr; Add a platform (<strong>Web</strong> or <strong>SPA</strong>) &rarr; Paste this Redirect URI and click <strong>Save</strong>.
                  </p>
                </div>

                {/* Big Connect Outlook Action Button */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 font-medium">
                    {smtpConfig.refreshToken ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Microsoft Refresh Token Saved
                      </span>
                    ) : (
                      <span>Not connected with Microsoft OAuth yet</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectOutlook}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center gap-2 text-xs"
                  >
                    <KeyRound className="w-4 h-4" />
                    Connect Outlook (Microsoft Sign-In)
                  </button>
                </div>
              </div>
            )}

            {/* Outlook Email Signature Configuration Section */}
            <div className="p-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-crm-navy">
                  <input
                    type="checkbox"
                    checked={smtpConfig.includeSignature}
                    onChange={(e) => setSmtpConfig(prev => ({ ...prev, includeSignature: e.target.checked }))}
                    className="w-4 h-4 rounded text-crm-navy focus:ring-crm-navy border-slate-300"
                  />
                  <Sparkles className="w-4 h-4 text-crm-lime" />
                  <span>Automatically Append Outlook / Email Signature to Sent Emails</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateSignature}
                    disabled={generatingSignature}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 shadow-2xs flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingSignature ? 'animate-spin' : ''}`} />
                    Auto-Generate from Outlook / Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSignatureCode(prev => !prev)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors"
                  >
                    {showSignatureCode ? 'Hide Code' : 'Edit Signature HTML'}
                  </button>
                </div>
              </div>

              {smtpConfig.includeSignature && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Additional Profile Info for Signature */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 text-[11px] mb-1">Job Title</label>
                      <input
                        type="text"
                        name="jobTitle"
                        value={smtpConfig.jobTitle}
                        onChange={handleSmtpChange}
                        placeholder="e.g. Sales Director"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-[11px] mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="phone"
                        value={smtpConfig.phone}
                        onChange={handleSmtpChange}
                        placeholder="e.g. +1 (555) 019-2834"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 text-[11px] mb-1">Company / Website</label>
                      <input
                        type="text"
                        name="companyName"
                        value={smtpConfig.companyName}
                        onChange={handleSmtpChange}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white"
                      />
                    </div>
                  </div>

                  {/* Rendered Live Signature Preview */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 mb-1">Signature Preview:</div>
                    {smtpConfig.signature ? (
                      <div
                        className="text-xs"
                        dangerouslySetInnerHTML={{ __html: smtpConfig.signature }}
                      />
                    ) : (
                      <div className="text-xs text-slate-400 italic">
                        No signature configured yet. Click "Auto-Generate from Outlook / Profile" above.
                      </div>
                    )}
                  </div>

                  {/* Custom HTML Code Editor */}
                  {showSignatureCode && (
                    <div className="space-y-1 pt-1">
                      <label className="block font-bold text-slate-700 text-[11px]">
                        Custom HTML Signature Source Code:
                      </label>
                      <textarea
                        rows={4}
                        name="signature"
                        value={smtpConfig.signature}
                        onChange={handleSmtpChange}
                        placeholder="<p>Best regards,<br/><b>Your Name</b></p>"
                        className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Test Connection Banner / Message */}
            {testResult && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span className="font-semibold">{testResult.message}</span>
              </div>
            )}

            {/* Control Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  Disconnect Account
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingSmtp || !smtpConfig.user}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                  <span>{testingSmtp ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSmtp}
                  disabled={savingSmtp}
                  className="px-5 py-2 text-xs font-bold text-white bg-crm-navy hover:bg-slate-800 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingSmtp ? 'Saving...' : 'Save Credentials'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TinyFish Free AI Web Scraper & Lead Agent Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              TinyFish Free AI Web Scraper (100% Real Phone & Lead Extraction)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your TinyFish Free API Key to extract 100% real business phone numbers, contact emails, addresses, and LinkedIn profiles using autonomous AI web scraping.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-black shrink-0 border border-emerald-200/60">
            <Target className="w-3.5 h-3.5" />
            100% Free AI Agent
          </span>
        </div>

        <div className="space-y-4">
          {tinyfishResult && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              tinyfishResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {tinyfishResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{tinyfishResult.message}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">TinyFish API Key</label>
              <a
                href="https://agent.tinyfish.ai/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>Get Free TinyFish API Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showTinyfishKey ? 'text' : 'password'}
                autoComplete="off"
                value={tinyfishKey}
                onChange={(e) => setTinyfishKey(e.target.value)}
                placeholder="tf_... or paste your TinyFish API key"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="button"
                onClick={() => setShowTinyfishKey(!showTinyfishKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showTinyfishKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {isEnvTinyfishKey
                ? 'ℹ️ A TinyFish API key is currently detected in your server .env environment.'
                : 'TinyFish provides free AI web agent scraping keys at agent.tinyfish.ai'}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">
              Status: {hasTinyfishKey ? '🟢 TinyFish Active & Ready for Lead Grabbing' : '⚪ Not configured (uses Puppeteer browser fallback)'}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestTinyfishKey}
                disabled={testingTinyfish || !tinyfishKey.trim()}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingTinyfish ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-600" />}
                <span>{testingTinyfish ? 'Verifying...' : 'Test TinyFish API'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveTinyfishKey}
                disabled={savingTinyfish}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingTinyfish ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{savingTinyfish ? 'Saving...' : 'Save TinyFish Key'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Model Intelligence Studio & Provider Switcher Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              AI Lead Intelligence Studio & Model Switcher
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your preferred AI intelligence engine to find verified company emails, discover decision makers, and generate cold email sequences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 border ${
              activeAiProvider === 'gemini'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              Active: {activeAiProvider === 'gemini' ? 'Google Gemini' : 'DeepSeek AI'}
            </span>
          </div>
        </div>

        {/* Provider Switcher Selector */}
        <div className="p-1.5 bg-slate-100 rounded-2xl grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveAiProvider('gemini');
              handleSaveAiConfig('gemini');
            }}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeAiProvider === 'gemini'
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>🔵 Google Gemini AI</span>
            {hasGeminiKey && <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-black">Ready</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveAiProvider('deepseek');
              handleSaveAiConfig('deepseek');
            }}
            className={`flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all ${
              activeAiProvider === 'deepseek'
                ? 'bg-white text-purple-700 shadow-sm ring-1 ring-purple-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <span>🟣 DeepSeek / NVIDIA NIM</span>
            {hasDeepseekKey && <span className="text-[10px] px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded font-black">Ready</span>}
          </button>
        </div>

        {/* Google Gemini Configuration Box */}
        {activeAiProvider === 'gemini' && (
          <div className="space-y-4 p-4 rounded-xl bg-blue-50/40 border border-blue-100 animate-in fade-in duration-200">
            {geminiResult && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                geminiResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {geminiResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{geminiResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Google Gemini API Key</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <span>Get Free Gemini Key (Google AI Studio)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    autoComplete="off"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Gemini Model</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                >
                  <option value="gemini-1.5-flash">gemini-1.5-flash (⚡ Recommended & Ultra Fast)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (🚀 Next-Gen Fast)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (🧠 Deep Reasoning & Extraction)</option>
                  <option value="gemini-pro">gemini-pro (Standard Stable)</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 Google Gemini features built-in search grounding to find real business websites and corporate contact inboxes across the globe.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-blue-100">
              <div className="text-[11px] text-slate-600 font-semibold">
                Status: {hasGeminiKey ? '🟢 Google Gemini Active & Ready' : '⚪ Not configured (Paste your key above)'}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestGeminiKey}
                  disabled={testingGemini || !geminiKey.trim()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {testingGemini ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-blue-600" />}
                  <span>{testingGemini ? 'Testing...' : 'Test Google Gemini'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAiConfig('gemini')}
                  disabled={savingGemini}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingGemini ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingGemini ? 'Saving...' : 'Save & Activate Gemini'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DeepSeek AI Configuration Box */}
        {activeAiProvider === 'deepseek' && (
          <div className="space-y-4 p-4 rounded-xl bg-purple-50/40 border border-purple-100 animate-in fade-in duration-200">
            {deepseekResult && (
              <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
                deepseekResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {deepseekResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{deepseekResult.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">DeepSeek API Key / NVIDIA NIM Key</label>
                  <a
                    href="https://platform.deepseek.com/api_keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <span>Get DeepSeek Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showDeepseekKey ? 'text' : 'password'}
                    autoComplete="off"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="sk-... or nvapi-..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showDeepseekKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">DeepSeek Model</label>
                <select
                  value={deepseekModel}
                  onChange={(e) => setDeepseekModel(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                >
                  <option value="deepseek-ai/deepseek-v4-pro-0813">deepseek-ai/deepseek-v4-pro-0813 (NVIDIA NIM) [Default]</option>
                  <option value="deepseek-ai/deepseek-v4-flash-0731">deepseek-ai/deepseek-v4-flash-0731 (NVIDIA NIM)</option>
                  <option value="deepseek-chat">deepseek-chat (Official DeepSeek V3)</option>
                  <option value="deepseek-reasoner">deepseek-reasoner (Official DeepSeek R1)</option>
                </select>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 Supports NVIDIA NIM keys (<code className="font-mono text-purple-700">nvapi-...</code>), official DeepSeek keys (<code className="font-mono text-purple-700">sk-...</code>), or OpenRouter keys (<code className="font-mono text-purple-700">sk-or-...</code>).
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-purple-100">
              <div className="text-[11px] text-slate-600 font-semibold">
                Status: {hasDeepseekKey ? '🟢 DeepSeek AI Active & Ready' : '⚪ Not configured (Optional)'}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestDeepseekKey}
                  disabled={testingDeepseek || !deepseekKey.trim()}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {testingDeepseek ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-600" />}
                  <span>{testingDeepseek ? 'Testing...' : 'Test DeepSeek AI'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAiConfig('deepseek')}
                  disabled={savingDeepseek}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingDeepseek ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{savingDeepseek ? 'Saving...' : 'Save & Activate DeepSeek'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LinkedIn OAuth 2.0 & Decision Maker Lead Extractor Card */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-bold text-crm-navy flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#0077b5] text-white flex items-center justify-center font-bold text-xs">in</span>
              LinkedIn Integration & Decision Maker Lead Extractor
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect your official LinkedIn Developer App (OAuth 2.0) to automatically discover and extract high-level decision makers (CEOs, Founders, Directors) with verified LinkedIn profiles.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/linkedin"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-sky-50 hover:bg-sky-100 text-[#0077b5] border border-sky-200 transition-all shrink-0"
            >
              <span>Open LinkedIn Hub</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 border ${
              hasLinkedin ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${hasLinkedin ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {hasLinkedin ? `Connected: ${linkedinProfile?.name || 'LinkedIn Active'}` : 'Not Connected'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {linkedinResult && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              linkedinResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {linkedinResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{linkedinResult.message}</span>
            </div>
          )}

          {hasLinkedin && linkedinProfile && (
            <div className="p-4 bg-[#0077b5]/5 border border-[#0077b5]/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {linkedinProfile.picture ? (
                  <img src={linkedinProfile.picture} alt={linkedinProfile.name} className="w-10 h-10 rounded-full border border-[#0077b5]/40" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#0077b5] text-white flex items-center justify-center font-bold text-sm">
                    {linkedinProfile.name ? linkedinProfile.name.charAt(0) : 'in'}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{linkedinProfile.name}</h4>
                  <p className="text-[11px] text-slate-500">{linkedinProfile.email || 'LinkedIn Authorized User'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnectLinkedin}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Client ID *</label>
              <input
                type="text"
                value={linkedinClientId}
                onChange={(e) => setLinkedinClientId(e.target.value)}
                placeholder="e.g. 78abc123def456"
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0077b5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">LinkedIn Client Secret *</label>
              <div className="relative">
                <input
                  type={showLinkedinSecret ? 'text' : 'password'}
                  autoComplete="off"
                  value={linkedinClientSecret}
                  onChange={(e) => setLinkedinClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full py-2.5 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0077b5]"
                />
                <button
                  type="button"
                  onClick={() => setShowLinkedinSecret(!showLinkedinSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showLinkedinSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Redirect URI Box */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-blue-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                OAuth 2.0 Authorized Redirect URL (Add in LinkedIn Developer Portal)
              </span>
              <button
                type="button"
                onClick={() => {
                  const uri = window.location.origin + '/auth/linkedin/callback';
                  navigator.clipboard.writeText(uri);
                  showSuccess('Redirect URI copied to clipboard!');
                }}
                className="px-2.5 py-1 bg-[#0077b5] hover:bg-blue-700 text-white font-extrabold rounded-lg text-[10px] transition-colors shrink-0"
              >
                Copy Redirect URL
              </button>
            </div>
            <div className="font-mono bg-white p-2 rounded-lg border border-blue-200 text-slate-800 text-[11px] font-bold overflow-x-auto">
              {window.location.origin}/auth/linkedin/callback
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              In <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noreferrer" className="underline text-[#0077b5] font-bold">LinkedIn Developer Portal</a> &rarr; Select your App &rarr; <strong>Auth</strong> tab &rarr; <strong>Authorized redirect URLs for your app</strong> &rarr; Add this URL and save.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">
              Live Decision Maker Extractor Active: <strong className="text-emerald-700">Ready in Leads Grab</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestLinkedinSearch}
                disabled={testingLinkedin}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
              >
                {testingLinkedin ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4 text-[#0077b5]" />}
                <span>{testingLinkedin ? 'Testing Extractor...' : 'Test Decision Maker Search'}</span>
              </button>

              <button
                type="button"
                onClick={handleConnectLinkedin}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0077b5] hover:bg-[#006097] rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Connect LinkedIn (OAuth 2.0)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── DISCORD COMMUNITIES & LEAD WEBHOOK INTEGRATION ── */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-md shadow-[#5865F2]/20">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">Discord Business Communities & Webhook Alerts</h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/20">
                  LEADS GRAB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Mine business leads from Discord servers and send real-time CRM notifications via Discord Webhooks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/leads-grab?channel=discord"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 text-[#5865F2] font-black text-xs transition-colors shrink-0"
            >
              <span>Open Discord Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shrink-0 border ${
              hasDiscordConfig ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${hasDiscordConfig ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {hasDiscordConfig ? 'Configured' : 'Optional Setup'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {discordResult && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              discordResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {discordResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{discordResult.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Discord Webhook URL (For Alerts)</label>
              <input
                type="text"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5865F2]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Discord Bot Token (Optional Developer Mode)</label>
              <div className="relative">
                <input
                  type={showDiscordToken ? 'text' : 'password'}
                  autoComplete="off"
                  value={discordBotToken}
                  onChange={(e) => setDiscordBotToken(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full py-2.5 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#5865F2]"
                />
                <button
                  type="button"
                  onClick={() => setShowDiscordToken(!showDiscordToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showDiscordToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 text-xs text-slate-600">
            <p className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              How to create a Discord Webhook URL:
            </p>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Inside your Discord Server &rarr; Channel Settings (e.g. <code>#leads</code>) &rarr; <strong>Integrations</strong> &rarr; <strong>Webhooks</strong> &rarr; <strong>New Webhook</strong> &rarr; <strong>Copy Webhook URL</strong> and paste it above.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 font-semibold">
              Discord Lead Grabber: <strong className="text-emerald-700">Ready in Leads Grab Discovery Hub</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestDiscordWebhook}
                disabled={testingDiscord || !discordWebhookUrl.trim()}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {testingDiscord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-[#5865F2]" />}
                <span>{testingDiscord ? 'Sending Test...' : 'Test Webhook Alert'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDiscordConfig}
                disabled={savingDiscord}
                className="px-5 py-2 text-xs font-bold text-white bg-[#5865F2] hover:bg-[#4752c4] rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {savingDiscord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Discord Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

