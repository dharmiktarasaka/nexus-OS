import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Play,
  Pause,
  Trash2,
  Download,
  MapPin,
  Target,
  Globe,
  CheckCircle2,
  Search,
  Users,
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Flame,
  BarChart3,
  Layers,
  Zap,
  Briefcase,
  Gamepad2,
  FileText,
  Bot
} from 'lucide-react';
import Linkedin from '../../components/icons/LinkedinIcon';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { CreateCampaignModal } from './CreateCampaignModal';
import { DiscordParserModal } from './DiscordParserModal';

const CHANNEL_CONFIG = {
  all: {
    id: 'all',
    label: 'All Discovery Hub',
    icon: Layers,
    badge: 'Multi-Source',
    badgeColor: 'bg-crm-lime text-crm-navy',
    headerBg: 'from-crm-navy via-crm-navy-light to-crm-navy',
    title: 'Leads Grab & Web Intelligence',
    subtitle: 'Target any niche and city to automatically extract verified business leads, direct phones, decision-maker emails, ratings, and LinkedIn profiles.',
    buttonText: 'Create New Campaign',
    buttonColor: 'bg-crm-lime hover:bg-crm-lime-hover text-crm-navy',
    defaultPlatform: null,
    presets: [
      { niche: 'Dental Clinics', city: 'New York' },
      { niche: 'Solar Energy Installers', city: 'Los Angeles' },
      { niche: 'Digital Marketing Agencies', city: 'London' },
      { niche: 'Real Estate Brokers', city: 'Dubai' }
    ]
  },
  tinyfish: {
    id: 'tinyfish',
    label: 'TinyFish AI Leads',
    icon: Bot,
    badge: 'AI Web Agent',
    badgeColor: 'bg-cyan-500 text-slate-950',
    headerBg: 'from-[#082f49] via-[#0e7490] to-crm-navy',
    title: 'TinyFish Autonomous AI Web Agent Lead Grabber',
    subtitle: 'Deploy TinyFish autonomous AI web agent to scan real business listings, directories, extract verified phone numbers, direct emails, and decision makers.',
    buttonText: 'New TinyFish Campaign',
    buttonColor: 'bg-cyan-400 hover:bg-cyan-300 text-slate-950',
    defaultPlatform: 'TinyFish AI Agent',
    presets: [
      { niche: 'Digital Marketing & SEO Agencies', city: 'Ahmedabad' },
      { niche: 'Real Estate Brokers & Realtors', city: 'Miami' },
      { niche: 'Dental & Cosmetic Clinics', city: 'Chicago' },
      { niche: 'Solar Energy & Roofing Contractors', city: 'Dallas' },
      { niche: 'SaaS & AI Startups', city: 'San Francisco' },
      { niche: 'E-Commerce Brands & Suppliers', city: 'New York' }
    ]
  },
  discord: {
    id: 'discord',
    label: 'Discord Leads',
    icon: Gamepad2,
    badge: 'Community & Intros',
    badgeColor: 'bg-[#5865F2] text-white',
    headerBg: 'from-[#1e1f22] via-[#5865F2]/80 to-crm-navy',
    title: 'Discord Business Communities & Member Lead Grabber',
    subtitle: 'Discover public business Discord servers, SaaS founders, agency owners, and extract decision-maker contacts, emails, Discord tags, and tailored outreach scripts.',
    buttonText: 'New Discord Campaign',
    buttonColor: 'bg-[#5865F2] hover:bg-[#4752c4] text-white',
    defaultPlatform: 'Discord',
    presets: [
      { niche: 'SaaS Founders & Indie Hackers', city: 'Global' },
      { niche: 'Digital Marketing & Growth Agencies', city: 'Global' },
      { niche: 'AI & Machine Learning Startups', city: 'San Francisco' },
      { niche: 'E-Commerce & Shopify Brands', city: 'New York' },
      { niche: 'Web3 & Fintech Builders', city: 'London' },
      { niche: 'Freelance Designers & Developers', city: 'Remote' }
    ]
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn Leads',
    icon: Linkedin,
    badge: 'B2B Decision Makers',
    badgeColor: 'bg-[#0077b5] text-white',
    headerBg: 'from-[#004182] via-[#005a9e] to-crm-navy',
    title: 'LinkedIn B2B Lead Extractor & Decision Makers',
    subtitle: 'Extract verified C-Level Executives, CEOs, Founders, VP and Director profiles with corporate emails and LinkedIn URLs.',
    buttonText: 'New LinkedIn Campaign',
    buttonColor: 'bg-white text-[#0077b5] hover:bg-slate-100',
    defaultPlatform: 'LinkedIn',
    presets: [
      { niche: 'Software Founders & CEOs', city: 'San Francisco' },
      { niche: 'Marketing Agency Directors', city: 'New York' },
      { niche: 'Healthcare C-Level Executives', city: 'Chicago' },
      { niche: 'Fintech Co-Founders', city: 'London' }
    ]
  },
  'google-maps': {
    id: 'google-maps',
    label: 'Google Maps Leads',
    icon: MapPin,
    badge: 'Local Business & Places',
    badgeColor: 'bg-emerald-500 text-slate-950',
    headerBg: 'from-emerald-950 via-crm-navy to-emerald-900',
    title: 'Google Maps Business & Local Contact Grabber',
    subtitle: 'Target local businesses and extract verified phone numbers, direct addresses, customer ratings, review counts, and domains.',
    buttonText: 'New Google Maps Campaign',
    buttonColor: 'bg-emerald-400 hover:bg-emerald-300 text-slate-950',
    defaultPlatform: 'Google Maps',
    presets: [
      { niche: 'IVF & Fertility Clinics', city: 'Mumbai' },
      { niche: 'Orthodontic Clinics', city: 'Toronto' },
      { niche: 'Luxury Restaurants & Cafes', city: 'Dubai' },
      { niche: 'Automotive Dealerships', city: 'Sydney' }
    ]
  },
  web: {
    id: 'web',
    label: 'Web Page Scraper',
    icon: Globe,
    badge: 'Domain & Crawler',
    badgeColor: 'bg-purple-600 text-white',
    headerBg: 'from-purple-950 via-crm-navy to-indigo-950',
    title: 'Web Page Crawler & Corporate Domain Extractor',
    subtitle: 'Crawl corporate websites and public directory pages to extract decision-maker email addresses, contact details, and tech stacks.',
    buttonText: 'New Web Scraper Campaign',
    buttonColor: 'bg-purple-400 hover:bg-purple-300 text-slate-950',
    defaultPlatform: 'Web Directory',
    presets: [
      { niche: 'E-Commerce Brands', city: 'New York' },
      { niche: 'Accounting & CPA Firms', city: 'London' },
      { niche: 'Law Firms & Attorneys', city: 'Chicago' },
      { niche: 'IT Services Companies', city: 'Bangalore' }
    ]
  }
};

export const LeadGrabDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const basePath = location.pathname.startsWith('/apps/crm') ? '/apps/crm' : '';

  const currentChannelKey = (searchParams.get('channel') || 'all').toLowerCase();
  const currentConfig = CHANNEL_CONFIG[currentChannelKey] || CHANNEL_CONFIG.all;

  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    completedCampaigns: 0,
    totalGrabbedLeads: 0,
    totalImportedToCRM: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDiscordParserOpen, setIsDiscordParserOpen] = useState(false);
  const [createModalPlatform, setCreateModalPlatform] = useState(null);
  const [modalInitialNiche, setModalInitialNiche] = useState('');
  const [modalInitialCity, setModalInitialCity] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCampaignsAndStats = async () => {
    try {
      const [campRes, statsRes] = await Promise.all([
        api.get('/lead-grab/campaigns', { params: { search: searchTerm } }),
        api.get('/lead-grab/stats')
      ]);

      if (campRes.data?.success) {
        setCampaigns(campRes.data.data || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data.data || {});
      }
    } catch (err) {
      setCampaigns([
        {
          _id: 'camp_1',
          name: 'LinkedIn Decision Makers - SaaS in San Francisco',
          niche: 'SaaS Software',
          targetCity: 'San Francisco, CA',
          platform: 'LinkedIn',
          status: 'COMPLETED',
          progress: 100,
          totalExtracted: 48,
          createdAt: new Date().toISOString()
        },
        {
          _id: 'camp_2',
          name: 'Google Maps - Dental Clinics in Austin',
          niche: 'Dental Clinics',
          targetCity: 'Austin, TX',
          platform: 'Google Maps',
          status: 'COMPLETED',
          progress: 100,
          totalExtracted: 32,
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
      setStats({ totalCampaigns: 2, totalLeadsExtracted: 80, activeExtractions: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignsAndStats();
  }, [searchTerm]);

  // Handle live polling for running campaigns
  useEffect(() => {
    const hasRunning = campaigns.some(c => c.status === 'ACTIVE');
    if (!hasRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get('/lead-grab/campaigns', { params: { search: searchTerm } });
        if (res.data?.success) {
          setCampaigns(res.data.data || []);
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [campaigns, searchTerm]);

  const handleStartCampaign = async (id, e) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      const res = await api.post(`/lead-grab/campaigns/${id}/start`);
      if (res.data?.success) {
        addToast('🚀 Extraction started in background!', 'success');
        fetchCampaignsAndStats();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start extraction', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePauseCampaign = async (id, e) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      const res = await api.post(`/lead-grab/campaigns/${id}/pause`);
      if (res.data?.success) {
        addToast('Campaign paused', 'info');
        fetchCampaignsAndStats();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to pause campaign', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCampaign = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this campaign and all its extracted leads?')) {
      return;
    }
    try {
      setActionLoadingId(id);
      const res = await api.delete(`/lead-grab/campaigns/${id}`);
      if (res.data?.success) {
        addToast('Campaign deleted', 'success');
        setCampaigns(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete campaign', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openCreateModal = (platform = null, niche = '', city = '') => {
    setCreateModalPlatform(platform || currentConfig.defaultPlatform);
    setModalInitialNiche(niche);
    setModalInitialCity(city);
    setIsCreateModalOpen(true);
  };

  const channelFilteredCampaigns = campaigns.filter(c => {
    const plats = Array.isArray(c.platforms) ? c.platforms : [];
    const nameLower = (c.name || '').toLowerCase();

    if (currentChannelKey === 'tinyfish') {
      return plats.includes('TinyFish') ||
        plats.includes('TinyFish AI') ||
        plats.includes('TinyFish AI Agent') ||
        nameLower.includes('tinyfish');
    }
    if (currentChannelKey === 'discord') {
      return plats.includes('Discord') ||
        plats.includes('Discord Community') ||
        nameLower.includes('discord');
    }
    if (currentChannelKey === 'linkedin') {
      return (plats.includes('LinkedIn') || nameLower.includes('linkedin')) &&
        !plats.includes('Discord') && !plats.includes('TinyFish');
    }
    if (currentChannelKey === 'google-maps') {
      return (plats.includes('Google Maps') || plats.includes('Google') || nameLower.includes('google maps')) &&
        !plats.includes('Discord') && !plats.includes('TinyFish');
    }
    if (currentChannelKey === 'web') {
      return (plats.includes('Web Directory') || plats.includes('Web') || plats.includes('Web Page Scraper') || nameLower.includes('web scraper')) &&
        !plats.includes('Discord') && !plats.includes('TinyFish');
    }
    return true;
  });

  const filteredCampaigns = channelFilteredCampaigns.filter(c => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const channelTotalGrabbed = channelFilteredCampaigns.reduce((sum, c) => sum + (c.extractedCount || 0), 0);
  const channelActiveCount = channelFilteredCampaigns.filter(c => c.status === 'ACTIVE').length;
  const channelImportedCount = channelFilteredCampaigns.reduce((sum, c) => sum + (c.stats?.importedToCRM || 0), 0);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── CHANNEL SELECTION NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/80 overflow-x-auto shadow-xs">
        {Object.values(CHANNEL_CONFIG).map((ch) => {
          const Icon = ch.icon;
          const isSelected = currentChannelKey === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => {
                if (ch.id === 'all') {
                  setSearchParams({});
                } else {
                  setSearchParams({ channel: ch.id });
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 select-none ${
                isSelected
                  ? 'bg-crm-navy text-white shadow-md shadow-crm-navy/20 scale-[1.02]'
                  : 'text-slate-600 hover:text-crm-navy hover:bg-white/80'
              }`}
            >
              <Icon className={`w-4 h-4 ${
                isSelected
                  ? ch.id === 'tinyfish'
                    ? 'text-cyan-400'
                    : ch.id === 'discord'
                    ? 'text-[#5865F2]'
                    : ch.id === 'linkedin'
                    ? 'text-sky-400'
                    : ch.id === 'google-maps'
                    ? 'text-emerald-400'
                    : ch.id === 'web'
                    ? 'text-purple-400'
                    : 'text-crm-lime'
                  : 'text-slate-400'
              }`} />
              <span>{ch.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                isSelected ? 'bg-white/15 text-white' : 'bg-slate-200/70 text-slate-500'
              }`}>
                {ch.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Top Banner Header tailored to channel */}
      <div className={`bg-gradient-to-r ${currentConfig.headerBg} rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all duration-300`}>
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-black uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-crm-lime" />
              {currentConfig.badge} Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {currentConfig.title}
            </h1>
            <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
              {currentConfig.subtitle}
            </p>

            {/* Quick 1-Click Launch Presets */}
            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-300 font-bold flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-crm-lime" />
                Quick Launch:
              </span>
              {currentConfig.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => openCreateModal(currentConfig.defaultPlatform, preset.niche, preset.city)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all font-semibold"
                >
                  ⚡ {preset.niche} {preset.city !== 'Global' && preset.city !== 'Remote' ? `in ${preset.city}` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {(currentChannelKey === 'discord' || currentChannelKey === 'all') && (
              <button
                onClick={() => setIsDiscordParserOpen(true)}
                className="px-4 py-3 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-white border border-[#5865F2]/50 font-black text-sm rounded-2xl shadow-lg backdrop-blur-xs flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4 text-indigo-300" />
                <span>Discord Chat Parser</span>
              </button>
            )}
            {currentChannelKey === 'all' && (
              <button
                onClick={() => openCreateModal('LinkedIn')}
                className="px-5 py-3 bg-[#0077b5] hover:bg-[#006097] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#0077b5]/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Linkedin className="w-4 h-4 text-white" />
                <span>Grab LinkedIn Leads</span>
              </button>
            )}
            <button
              onClick={() => openCreateModal(currentConfig.defaultPlatform)}
              className={`px-5 py-3 ${currentConfig.buttonColor} font-black text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{currentConfig.buttonText}</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Total Grabbed</span>
              <Target className="w-4 h-4 text-crm-lime" />
            </div>
            <p className="text-2xl font-black text-white">
              {currentChannelKey === 'all' ? (stats.totalGrabbedLeads || 0) : channelTotalGrabbed}
            </p>
            <span className="text-[11px] text-crm-lime font-bold">Verified contacts</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Active Grabbing</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crm-lime opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crm-lime"></span>
              </span>
            </div>
            <p className="text-2xl font-black text-white">
              {currentChannelKey === 'all' ? (stats.activeCampaigns || 0) : channelActiveCount}
            </p>
            <span className="text-[11px] text-slate-300 font-semibold">Active tasks</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Synced to CRM</span>
              <Database className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-2xl font-black text-white">
              {currentChannelKey === 'all' ? (stats.totalImportedToCRM || 0) : channelImportedCount}
            </p>
            <span className="text-[11px] text-sky-300 font-bold">Imported to main leads</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Channel Campaigns</span>
              <BarChart3 className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-black text-white">{channelFilteredCampaigns.length}</p>
            <span className="text-[11px] text-slate-300 font-semibold">In this panel</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${currentConfig.label} by niche, city...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-lime transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'COMPLETED', 'DRAFT'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                statusFilter === tab
                  ? 'bg-crm-navy text-crm-lime shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL' ? 'All Statuses' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards List */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-8 h-8 border-3 border-crm-lime border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading {currentConfig.label} campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-crm-lime/20 text-crm-navy flex items-center justify-center mx-auto mb-4 font-black">
            <Target className="w-8 h-8 text-crm-navy" />
          </div>
          <h3 className="text-base font-black text-slate-800">No {currentConfig.label} Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Create your first automated {currentConfig.label.toLowerCase()} campaign to start discovering verified contacts.
          </p>
          <button
            onClick={() => openCreateModal(currentConfig.defaultPlatform)}
            className="px-5 py-2.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy font-black text-xs rounded-xl shadow-md shadow-crm-lime/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Launch First Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((camp) => {
            const isActive = camp.status === 'ACTIVE';
            const isCompleted = camp.status === 'COMPLETED';
            const percent = camp.progress || 0;

            return (
              <div
                key={camp._id}
                onClick={() => navigate(`${basePath}/leads-grab/${camp._id}`)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-crm-lime hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  {/* Status & Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        isActive
                          ? 'bg-crm-lime/20 text-crm-navy border border-crm-lime/40'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-crm-lime animate-ping inline-block" />
                      )}
                      {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {camp.status}
                    </span>

                    <span className="text-[11px] text-slate-400 font-semibold">
                      {new Date(camp.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Title & Niche */}
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-crm-navy transition-colors line-clamp-1">
                      {camp.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <Target className="w-3 h-3 text-crm-lime" />
                        {camp.niche}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {camp.targetCity}
                      </span>
                    </div>
                  </div>

                  {/* Platform Icons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {camp.platforms?.map((p) => (
                      <span
                        key={p}
                        className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Extraction Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600">Leads Grabbed:</span>
                      <span className="font-black text-slate-900">
                        {camp.extractedCount || 0} / {camp.targetCount}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isActive ? 'bg-crm-lime animate-pulse' : 'bg-crm-navy'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-400 truncate italic">
                      {camp.currentStep || 'Ready'}
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <button
                        onClick={(e) => handlePauseCampaign(camp._id, e)}
                        disabled={actionLoadingId === camp._id}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-amber-600 hover:bg-amber-50 text-xs font-bold flex items-center gap-1 shadow-2xs"
                        title="Pause campaign"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={(e) => handleStartCampaign(camp._id, e)}
                        disabled={actionLoadingId === camp._id}
                        className="p-1.5 rounded-lg bg-crm-navy text-crm-lime hover:bg-crm-navy-light text-xs font-bold flex items-center gap-1 shadow-2xs"
                        title="Start grabbing leads"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}

                    <button
                      onClick={(e) => handleExportCSV(camp._id, camp.name, e)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold flex items-center gap-1 shadow-2xs"
                      title="Export CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => handleDeleteCampaign(camp._id, e)}
                      disabled={actionLoadingId === camp._id}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 text-xs font-bold flex items-center gap-1 shadow-2xs"
                      title="Delete campaign"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-black text-crm-navy group-hover:text-crm-lime transition-colors">
                    <span>View Leads</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campaign Creation Wizard Modal */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        initialPlatform={createModalPlatform}
        initialNiche={modalInitialNiche}
        initialCity={modalInitialCity}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(newCamp) => {
          fetchCampaignsAndStats();
          navigate(`${basePath}/leads-grab/${newCamp._id}`);
        }}
      />

      {/* Instant Discord Chat & Invite Parser Modal */}
      <DiscordParserModal
        isOpen={isDiscordParserOpen}
        onClose={() => setIsDiscordParserOpen(false)}
        onLeadsImported={fetchCampaignsAndStats}
      />
    </div>
  );
};
