import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Target,
  Layers,
  Search,
  Check,
  Zap,
  Globe,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import Linkedin from '../../components/icons/LinkedinIcon';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const POPULAR_NICHES = [
  'SaaS Founders & Indie Hackers',
  'Digital Marketing & SEO Agencies',
  'AI & Machine Learning Startups',
  'E-Commerce & Shopify Brands',
  'Web3 & Crypto Founders',
  'Freelance Designers & Developers',
  'IVF & Fertility Clinics',
  'Real Estate Agencies',
  'Dental & Orthodontic Clinics',
  'Healthcare & Hospitals',
  'Restaurants & Cafes',
  'Gyms & Fitness Centers',
  'Solar & Renewable Energy',
  'Law Firms & Attorneys',
  'Accounting & CPA Firms',
  'IT Services & Software',
  'Home Remodeling & Contractors',
  'Automotive Dealerships & Repair'
];

const POPULAR_CITIES = [
  { city: 'Global', country: 'Global' },
  { city: 'New York', country: 'United States' },
  { city: 'San Francisco', country: 'United States' },
  { city: 'London', country: 'United Kingdom' },
  { city: 'Dubai', country: 'United Arab Emirates' },
  { city: 'Mumbai', country: 'India' },
  { city: 'Toronto', country: 'Canada' },
  { city: 'Sydney', country: 'Australia' },
  { city: 'Los Angeles', country: 'United States' },
  { city: 'Bangalore', country: 'India' },
  { city: 'Chicago', country: 'United States' },
  { city: 'Singapore', country: 'Singapore' }
];

const PLATFORM_OPTIONS = [
  { id: 'TinyFish', label: 'TinyFish AI Web Agent', desc: 'Autonomous web agent for direct verified business leads & phones', icon: '🤖' },
  { id: 'Discord', label: 'Discord Communities', desc: 'SaaS, Founders, Marketing, Tech & E-Com Business Hubs', icon: '🎮' },
  { id: 'LinkedIn', label: 'LinkedIn Network', desc: 'Verified Decision Makers, CEOs, Founders & C-Level', icon: '💼' },
  { id: 'Google Maps', label: 'Google Maps', desc: 'Ratings, reviews, phone, physical address', icon: '🗺️' },
  { id: 'Web Directory', label: 'Web & Yellow Pages', desc: 'Corporate websites, official contact emails', icon: '🌐' },
  { id: 'Yelp & Local', label: 'Yelp & Local Search', desc: 'Customer sentiment, operating hours', icon: '⭐' }
];

export const CreateCampaignModal = ({
  isOpen,
  onClose,
  onCampaignCreated,
  initialPlatform = null,
  initialNiche = '',
  initialCity = ''
}) => {
  const { addToast } = useToast();
  const [niche, setNiche] = useState(initialNiche || '');
  const [targetCity, setTargetCity] = useState(initialCity || '');
  const [targetCountry, setTargetCountry] = useState('United States');
  const [campaignName, setCampaignName] = useState('');
  const [platforms, setPlatforms] = useState(
    initialPlatform === 'TinyFish' || initialPlatform === 'TinyFish AI Agent'
      ? ['TinyFish']
      : initialPlatform === 'Discord'
      ? ['Discord']
      : initialPlatform === 'LinkedIn'
      ? ['LinkedIn']
      : ['Google Maps', 'LinkedIn', 'Web Directory']
  );
  const [targetCount, setTargetCount] = useState(25);
  const [requirePhone, setRequirePhone] = useState(true);
  const [requireEmail, setRequireEmail] = useState(true);
  const [minRating, setMinRating] = useState(4.0);
  const [autoStart, setAutoStart] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialNiche) setNiche(initialNiche);
      if (initialCity) setTargetCity(initialCity);
      if (initialPlatform === 'TinyFish' || initialPlatform === 'TinyFish AI Agent') {
        setPlatforms(['TinyFish']);
        if (initialNiche && initialCity) {
          setCampaignName(`TinyFish AI - ${initialNiche} in ${initialCity}`);
        }
      } else if (initialPlatform === 'Discord') {
        setPlatforms(['Discord']);
        if (initialNiche) {
          setCampaignName(`Discord Communities - ${initialNiche}`);
        }
      } else if (initialPlatform === 'LinkedIn') {
        setPlatforms(['LinkedIn']);
        if (initialNiche && initialCity) {
          setCampaignName(`LinkedIn Decision Makers - ${initialNiche} in ${initialCity}`);
        }
      }
    }
  }, [isOpen, initialPlatform, initialNiche, initialCity]);

  // Auto update default campaign name when niche or city changes
  useEffect(() => {
    if (niche && targetCity) {
      if (platforms.includes('TinyFish') && platforms.length === 1) {
        setCampaignName(`TinyFish AI - ${niche} in ${targetCity}`);
      } else if (platforms.includes('Discord') && platforms.length === 1) {
        setCampaignName(`Discord Communities - ${niche}`);
      } else if (platforms.includes('LinkedIn') && platforms.length === 1) {
        setCampaignName(`LinkedIn Decision Makers - ${niche} in ${targetCity}`);
      } else {
        setCampaignName(`${niche} in ${targetCity}`);
      }
    } else if (niche) {
      setCampaignName(`${niche} Campaign`);
    }
  }, [niche, targetCity, platforms]);

  if (!isOpen) return null;

  const togglePlatform = (pId) => {
    if (platforms.includes(pId)) {
      if (platforms.length === 1) return; // keep at least 1
      setPlatforms(platforms.filter(p => p !== pId));
    } else {
      setPlatforms([...platforms, pId]);
    }
  };

  const handleSelectCity = (c) => {
    setTargetCity(c.city);
    setTargetCountry(c.country);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!niche.trim() || !targetCity.trim()) {
      addToast('Please enter or select both a Target Niche and City', 'warning');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/lead-grab/campaigns', {
        name: campaignName.trim() || `${niche} in ${targetCity}`,
        niche: niche.trim(),
        targetCity: targetCity.trim(),
        targetCountry: targetCountry.trim(),
        platforms,
        targetCount: parseInt(targetCount, 10),
        config: {
          requirePhone,
          requireEmail,
          minRating: parseFloat(minRating) || 0
        },
        autoStart
      });

      if (res.data?.success) {
        addToast(
          autoStart
            ? '🚀 Campaign launched! Lead extraction in progress...'
            : 'Campaign created successfully as draft',
          'success'
        );
        onCampaignCreated(res.data.data);
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create campaign', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-crm-navy px-6 py-5 flex items-center justify-between text-white border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-crm-lime text-crm-navy flex items-center justify-center font-black shadow-md shadow-crm-lime/20">
              <Sparkles className="w-5 h-5 text-crm-navy" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Create Leads Grab Campaign</h2>
              <p className="text-xs text-slate-300">
                Discover verified niche leads from Google Maps, LinkedIn & Web
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Step 1: Target Niche / Industry */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-crm-navy flex items-center gap-1.5">
                <Target className="w-4 h-4 text-crm-lime" />
                1. Target Niche / Industry
                <span className="text-rose-500">*</span>
              </label>
            </div>
            <input
              type="text"
              required
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Type ANY specific niche (e.g. IVF Centers, Fertility Clinics, Solar Installers, Boutiques...)"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-lime focus:border-transparent transition-all"
            />
            {/* Niche quick tags */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {POPULAR_NICHES.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setNiche(item)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    niche === item
                      ? 'bg-crm-navy text-crm-lime shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Target City & Country */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-crm-navy flex items-center gap-1.5 mb-2">
              <MapPin className="w-4 h-4 text-crm-lime" />
              2. Target City & Location
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  placeholder="e.g. New York, London, Mumbai"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-lime focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Country</label>
                <input
                  type="text"
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  placeholder="e.g. United States, United Kingdom, India"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-lime focus:border-transparent transition-all"
                />
              </div>
            </div>
            {/* Quick Cities */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  type="button"
                  key={c.city}
                  onClick={() => handleSelectCity(c)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    targetCity.toLowerCase() === c.city.toLowerCase()
                      ? 'bg-crm-navy text-crm-lime shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📍 {c.city}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Discovery Platforms */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-crm-navy flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-crm-lime" />
                3. Data Sources & Search Platforms
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlatforms(['Google Maps', 'LinkedIn', 'Web Directory'])}
                  className="text-[10px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-colors"
                >
                  All Sources
                </button>
                <button
                  type="button"
                  onClick={() => setPlatforms(['LinkedIn'])}
                  className="text-[10px] font-black text-[#0077b5] bg-[#0077b5]/10 hover:bg-[#0077b5]/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                >
                  <Linkedin className="w-3 h-3 text-[#0077b5]" />
                  <span>LinkedIn Only</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLATFORM_OPTIONS.map((plat) => {
                const isSelected = platforms.includes(plat.id);
                return (
                  <div
                    key={plat.id}
                    onClick={() => togglePlatform(plat.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-crm-lime bg-crm-lime/10 ring-1 ring-crm-lime/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{plat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">{plat.label}</span>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-crm-lime text-crm-navy font-black' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && '✓'}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{plat.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 4: Lead Target Count & Campaign Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-crm-navy mb-1.5">
                Target Leads Count
              </label>
              <div className="flex items-center gap-2">
                {[15, 25, 50, 100].map((count) => (
                  <button
                    type="button"
                    key={count}
                    onClick={() => setTargetCount(count)}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                      targetCount === count
                        ? 'bg-crm-navy text-crm-lime shadow-xs ring-2 ring-crm-navy'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {count} Leads
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-crm-navy mb-1.5">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Real Estate in New York"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-lime"
              />
            </div>
          </div>

          {/* Filters & Options */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Filter Preferences:</span>
              <span className="text-[10px] text-slate-500 font-semibold">Automatic Lead Enrichment</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePhone}
                  onChange={(e) => setRequirePhone(e.target.checked)}
                  className="w-4 h-4 rounded text-crm-lime focus:ring-crm-lime accent-crm-navy"
                />
                Require Verified Phone Numbers
              </label>
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireEmail}
                  onChange={(e) => setRequireEmail(e.target.checked)}
                  className="w-4 h-4 rounded text-crm-lime focus:ring-crm-lime accent-crm-navy"
                />
                Extract Decision Maker Emails
              </label>
            </div>
          </div>

          {/* Instant Launch Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-crm-lime/10 border border-crm-lime/30 rounded-xl">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-crm-navy" />
              <div>
                <p className="text-xs font-black text-crm-navy">Auto-Start Grabbing Immediately</p>
                <p className="text-[11px] text-slate-600">
                  Begin extracting and organizing leads as soon as campaign is saved
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoStart}
              onChange={(e) => setAutoStart(e.target.checked)}
              className="w-5 h-5 rounded text-crm-navy accent-crm-navy cursor-pointer"
            />
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-crm-lime hover:bg-crm-lime-hover text-crm-navy font-black text-xs rounded-xl shadow-md shadow-crm-lime/20 flex items-center gap-2 transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-crm-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-crm-navy" />
              )}
              <span>{autoStart ? 'Launch & Grab Leads Now' : 'Create Campaign'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
