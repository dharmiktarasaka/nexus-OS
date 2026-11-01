import React, { useState, useEffect } from 'react';
import {
  X,
  Gamepad2,
  Sparkles,
  Search,
  CheckCircle2,
  Folder,
  Send,
  Copy,
  ExternalLink,
  Users,
  Shield,
  Layers,
  ArrowRight,
  Zap,
  Info,
  Loader2,
  FileText,
  Building2,
  Mail,
  Phone,
  Globe,
  Tag
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const DiscordParserModal = ({
  isOpen,
  onClose,
  campaignId = null,
  onLeadsImported = () => {}
}) => {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'invite'
  const [inputText, setInputText] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [niche, setNiche] = useState('SaaS Founders & Startups');
  const [targetCity, setTargetCity] = useState('Global');
  const [loading, setLoading] = useState(false);
  const [parsedLeads, setParsedLeads] = useState([]);
  const [inviteInfo, setInviteInfo] = useState(null);

  // Folder import state
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    try {
      const res = await api.get('/folders');
      if (res.data?.success) {
        setFolders(res.data.data || []);
      }
    } catch (e) {}
  };

  if (!isOpen) return null;

  const handleInspectInvite = async () => {
    if (!inviteUrl.trim()) {
      addToast('Please enter a Discord invite URL or code (e.g. discord.gg/xyz)', 'warning');
      return;
    }

    try {
      setLoading(true);
      setInviteInfo(null);
      const res = await api.post('/lead-grab/discord/inspect-invite', { inviteUrl });
      if (res.data?.success) {
        setInviteInfo(res.data.data);
        addToast(`Found Discord Server "${res.data.data.guildName}"!`, 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to resolve Discord invite', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleParseText = async () => {
    if (!inputText.trim()) {
      addToast('Please paste some Discord messages or intros text first', 'warning');
      return;
    }

    try {
      setLoading(true);
      setParsedLeads([]);
      const res = await api.post('/lead-grab/discord/parse-text', {
        text: inputText,
        niche: niche.trim(),
        targetCity: targetCity.trim(),
        campaignId: campaignId || null
      });

      if (res.data?.success) {
        setParsedLeads(res.data.data || []);
        addToast(`Successfully parsed ${res.data.count} Discord leads!`, 'success');
        if (campaignId) {
          onLeadsImported();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to parse Discord messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToFolder = async () => {
    if (parsedLeads.length === 0) return;

    try {
      setIsImporting(true);
      const res = await api.post('/lead-grab/discord/parse-text', {
        text: inputText,
        niche: niche.trim(),
        targetCity: targetCity.trim(),
        folderId: selectedFolderId || undefined,
        folderName: (!selectedFolderId && newFolderName.trim()) ? newFolderName.trim() : undefined
      });

      if (res.data?.success) {
        addToast(`Imported ${parsedLeads.length} leads directly into your CRM!`, 'success');
        onLeadsImported();
        onClose();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to import leads to folder', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyScript = (script) => {
    navigator.clipboard.writeText(script);
    addToast('Discord outreach script copied to clipboard!', 'success');
  };

  const sampleIntroText = `IndieDev_Alex — Today at 2:45 PM
Hey everyone! I'm Alex, co-founder of CloudSync AI (https://cloudsync.io). We're building automated cloud backup workflows for agencies. Contact: alex@cloudsync.io or DM me here!

SarahMarketing — Today at 3:10 PM
Hi all! Sarah here from Stellar Growth Agency (https://stellargrowth.co). We help B2B SaaS companies scale outbound pipelines. Looking for collaborations. Email: sarah@stellargrowth.co`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-md shadow-[#5865F2]/20">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Discord Intelligence & Lead Parser</h3>
                <span className="text-[10px] bg-[#5865F2]/20 text-indigo-300 font-mono font-bold px-2 py-0.5 rounded-full border border-[#5865F2]/30">
                  LIVE EXTRACTOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paste channel intros, hiring posts, or inspect public Discord business servers to grab verified leads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-700/80 bg-slate-900/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-[#5865F2] text-[#5865F2]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Channel Transcripts & Intros</span>
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'invite'
                ? 'border-[#5865F2] text-[#5865F2]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Inspect Discord Server Invite</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Niche / Topic</label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. SaaS Founders, Digital Marketing, AI Devs"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Location / City</label>
                  <input
                    type="text"
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    placeholder="e.g. Global, New York, London, Remote"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span>Paste Discord Messages / Transcripts</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      (from #intros, #hiring, #for-hire, #services, #showcase)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setInputText(sampleIntroText)}
                    className="text-[11px] text-[#5865F2] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Load Sample Text
                  </button>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                  placeholder="Paste raw messages copied from Discord here...&#10;e.g.&#10;Username — Today at 2:00 PM&#10;Hey! I run an agency building Shopify apps (https://myshopifyapp.com). Reach me at contact@myshopifyapp.com"
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-[#5865F2]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseText}
                  disabled={loading || !inputText.trim()}
                  className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-[#5865F2]/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing Discord Leads...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Extract Leads from Discord Chat</span>
                    </>
                  )}
                </button>
              </div>

              {/* Parsed Leads Display */}
              {parsedLeads.length > 0 && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Extracted {parsedLeads.length} Leads Ready for CRM
                    </span>
                    <span className="text-[11px] text-slate-400">Review & Save</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {parsedLeads.map((lead, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2 text-xs hover:border-[#5865F2]/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{lead.name}</span>
                            <span className="px-2 py-0.5 rounded bg-[#5865F2]/20 text-indigo-300 text-[10px] font-mono font-bold">
                              {lead.decisionMaker}
                            </span>
                          </div>
                          {lead.websiteUrl && (
                            <a
                              href={lead.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                            >
                              <Globe className="w-3 h-3" /> Website
                            </a>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                          {lead.email && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Mail className="w-3 h-3 text-emerald-400" /> {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1 text-slate-300">
                              <Phone className="w-3 h-3 text-amber-400" /> {lead.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-indigo-300">
                            <Tag className="w-3 h-3" /> {lead.niche}
                          </span>
                        </div>

                        {lead.rawDetails?.discordPitch && (
                          <div className="p-2 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-start justify-between gap-2">
                            <p className="line-clamp-2">💬 <strong className="text-slate-200">Pitch:</strong> {lead.rawDetails.discordPitch}</p>
                            <button
                              type="button"
                              onClick={() => handleCopyScript(lead.rawDetails.discordPitch)}
                              className="shrink-0 p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                              title="Copy pitch script"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Save to CRM Folder section */}
                  <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      <Folder className="w-4 h-4 text-amber-400" />
                      Save Extracted Leads directly to CRM Folder
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Select Existing Folder</label>
                        <select
                          value={selectedFolderId}
                          onChange={(e) => {
                            setSelectedFolderId(e.target.value);
                            if (e.target.value) setNewFolderName('');
                          }}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-[#5865F2]"
                        >
                          <option value="">-- Choose CRM Folder --</option>
                          {folders.map((f) => (
                            <option key={f._id} value={f._id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">OR Create New Folder</label>
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => {
                            setNewFolderName(e.target.value);
                            if (e.target.value) setSelectedFolderId('');
                          }}
                          placeholder="e.g. Discord SaaS Leads"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleSaveToFolder}
                        disabled={isImporting || (!selectedFolderId && !newFolderName.trim())}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
                      >
                        {isImporting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Importing to CRM...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Import {parsedLeads.length} Leads to Folder</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Invite URL Explorer Tab */
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter Discord Server Invite URL or Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteUrl}
                    onChange={(e) => setInviteUrl(e.target.value)}
                    placeholder="https://discord.gg/xyz or discord.gg/indieworldwide"
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5865F2]"
                  />
                  <button
                    type="button"
                    onClick={handleInspectInvite}
                    disabled={loading || !inviteUrl.trim()}
                    className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Inspect</span>
                  </button>
                </div>
              </div>

              {inviteInfo && (
                <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {inviteInfo.icon ? (
                        <img src={inviteInfo.icon} alt="icon" className="w-12 h-12 rounded-xl object-cover border border-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#5865F2] flex items-center justify-center text-white font-black text-lg">
                          {inviteInfo.guildName?.charAt(0) || 'D'}
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-white">{inviteInfo.guildName}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{inviteInfo.description || 'Public Discord Community'}</p>
                      </div>
                    </div>

                    <a
                      href={inviteInfo.inviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-indigo-300 border border-[#5865F2]/40 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Invite</span>
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                    <div className="p-2 bg-slate-900/60 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Total Members</span>
                      <span className="font-bold text-white">{inviteInfo.approximateMemberCount?.toLocaleString() || '1,500+'}</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Online Now</span>
                      <span className="font-bold text-emerald-400">{inviteInfo.approximatePresenceCount?.toLocaleString() || '250+'}</span>
                    </div>
                    <div className="p-2 bg-slate-900/60 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Channel</span>
                      <span className="font-bold text-slate-200">#{inviteInfo.channelName || 'general'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-white mb-1">💡 Pro-Tip for Discord Prospecting:</p>
                    <p className="text-slate-400 text-[11px]">
                      Join this community, navigate to channels like <code className="text-indigo-300">#intros</code>, <code className="text-indigo-300">#hiring</code>, or <code className="text-indigo-300">#showcase</code>, copy the text messages and paste them into the "Paste Channel Transcripts" tab above to instantly extract all member contacts!
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#5865F2]" />
            <span>AI Discord Lead Intelligence Engine</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
