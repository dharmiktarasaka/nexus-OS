import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  X,
  RefreshCw,
  ShieldCheck,
  Phone,
  User,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ListOrdered,
  Radio
} from 'lucide-react';
import api from '../services/api';

/**
 * WhatsAppLiveTracker
 *
 * Real-time tracker for WhatsApp broadcast campaigns featuring:
 * - Live countdown timer ticking down to the exact second of the next dispatch
 * - Active phone number & recipient display (which number is being messaged right now)
 * - Next upcoming number & recipient preview in line
 * - Anti-ban shield pacing status (Randomized delay, batch cooldown, hourly throttle)
 * - Complete live recipient queue modal/drawer with real-time status badges
 * - Cancel and navigate actions
 */
export const WhatsAppLiveTracker = ({
  initialData = null,
  onRefresh = null,
  mode = 'dashboard', // 'dashboard' | 'compact' | 'embedded'
  className = ''
}) => {
  const navigate = useNavigate();
  const [dispatchData, setDispatchData] = useState(initialData);
  const [timeLeftSec, setTimeLeftSec] = useState(0);
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(!initialData);

  // Poll live dispatch endpoint every 2.5 seconds when a campaign is running, or every 10s when idle
  useEffect(() => {
    let isMounted = true;

    let offlineStreak = 0;
    const fetchLiveDispatch = async () => {
      if (offlineStreak > 2 && !isRunning) return; // Stop polling if server is offline and no campaign
      try {
        const res = await api.get('/whatsapp/live-dispatch');
        if (isMounted) {
          if (res.data?.success) {
            offlineStreak = 0;
            setDispatchData(res.data);
          } else if (res.data?.offline) {
            offlineStreak++;
          }
        }
      } catch (err) {
        offlineStreak++;
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Initial fetch if no initialData provided
    if (!initialData) {
      fetchLiveDispatch();
    }

    const isRunning = dispatchData?.isRunning || dispatchData?.campaign?.status === 'IN_PROGRESS';
    const pollIntervalMs = isRunning ? 2500 : 30000;

    const interval = setInterval(fetchLiveDispatch, pollIntervalMs);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dispatchData?.isRunning, dispatchData?.campaign?.status]);

  // Synchronize initialData prop updates
  useEffect(() => {
    if (initialData) {
      setDispatchData(initialData);
    }
  }, [initialData]);

  const campaign = dispatchData?.campaign;
  const isRunning = Boolean(
    dispatchData?.isRunning ||
    (campaign && (campaign.status === 'IN_PROGRESS' || campaign.dispatchState === 'SENDING' || campaign.dispatchState === 'DELAY_WAIT'))
  );

  // 1-second interval live countdown timer ticking down to nextSendAt
  useEffect(() => {
    if (!isRunning || !campaign?.nextSendAt) {
      setTimeLeftSec(0);
      return;
    }

    const updateTimer = () => {
      const targetTime = new Date(campaign.nextSendAt).getTime();
      const diffMs = targetTime - Date.now();
      const seconds = Math.max(0, Math.ceil(diffMs / 1000));
      setTimeLeftSec(seconds);
    };

    updateTimer();
    const ticker = setInterval(updateTimer, 1000);
    return () => clearInterval(ticker);
  }, [campaign?.nextSendAt, isRunning]);

  // Cancel campaign handler
  const handleCancelCampaign = async () => {
    if (!campaign?._id) return;
    if (!window.confirm(`Are you sure you want to stop the WhatsApp broadcast "${campaign.title || 'Campaign'}"?`)) {
      return;
    }

    try {
      setCancelling(true);
      await api.post(`/whatsapp/campaigns/${campaign._id}/cancel`);
      // Update local state immediately
      setDispatchData((prev) => ({
        ...prev,
        isRunning: false,
        campaign: prev?.campaign ? { ...prev.campaign, status: 'CANCELLED', dispatchState: 'CANCELLED' } : null
      }));
      if (onRefresh) onRefresh();
    } catch (e) {
      alert(e.response?.data?.message || 'Could not cancel campaign.');
    } finally {
      setCancelling(false);
    }
  };

  // Format seconds to mm:ss or Xs
  const formatCountdown = (totalSec) => {
    if (totalSec <= 0) return '00:00';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Progress metrics
  const total = campaign?.totalRecipients || (campaign?.recipients ? campaign.recipients.length : 0) || 0;
  const success = campaign?.successCount || 0;
  const failed = campaign?.failedCount || 0;
  const processed = success + failed;
  const progressPercent = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  // Active recipient being messaged or just completed
  const currentRec = campaign?.currentRecipient;
  const nextRec = campaign?.nextRecipient;

  // Dispatch state description badge
  const renderDispatchStateBadge = () => {
    const state = campaign?.dispatchState || 'IDLE';
    switch (state) {
      case 'TYPING':
      case 'SENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>Simulating Typing & Sending...</span>
          </span>
        );
      case 'DELAY_WAIT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Anti-Ban Interval Active</span>
          </span>
        );
      case 'BATCH_COOLDOWN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>Micro-Batch Rest Pause</span>
          </span>
        );
      case 'HOURLY_THROTTLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Hourly Safe Velocity Limit</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Broadcast Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Broadcast Stopped</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-slate-800 text-slate-300 border border-slate-700">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <span>Ready for Broadcast</span>
          </span>
        );
    }
  };

  // If no campaign at all has ever run, render an introductory banner
  if (!campaign && !loading) {
    return (
      <div className={`p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-lg ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                WhatsApp Marketing Broadcast Engine
              </h3>
              <p className="text-xs text-slate-400">
                Track live outbound broadcasts, anti-ban message queues, and real-time delivery stats.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/whatsapp')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            <span>Launch New Broadcast</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Active Broadcast Live Tracking Card
  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
          isRunning
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-emerald-500/40 shadow-xl shadow-emerald-950/20'
            : 'bg-slate-900/90 border-slate-800 shadow-md'
        } ${className}`}
      >
        {/* Glow Header Bar when Active */}
        {isRunning && (
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
        )}

        <div className="p-5 sm:p-6 space-y-5">
          {/* Top Row: Title, Status, Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-inner ${
                  isRunning
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-black text-white">
                    {campaign?.title || 'Bulk WhatsApp Campaign'}
                  </h3>
                  {renderDispatchStateBadge()}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRunning
                    ? `Live Broadcast Dispatch in Progress • ${processed} of ${total} leads processed (${progressPercent}%)`
                    : `Last Broadcast Status • ${campaign?.status || 'COMPLETED'} • Total ${total} contacts`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isRunning && (
                <button
                  onClick={handleCancelCampaign}
                  disabled={cancelling}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors disabled:opacity-50"
                  title="Halt remaining messages immediately"
                >
                  {cancelling ? 'Stopping...' : 'Stop Campaign'}
                </button>
              )}

              <button
                onClick={() => setShowQueueModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10 text-xs font-bold transition-colors"
                title="Inspect real-time numbers and delivery log"
              >
                <ListOrdered className="w-3.5 h-3.5 text-emerald-400" />
                <span>View Full Queue ({total})</span>
              </button>

              <button
                onClick={() => navigate('/whatsapp')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-colors"
              >
                <span>WhatsApp Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Core Live Tracking Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Box 1: LIVE COUNTDOWN TIMER (Highlighted) */}
            <div className="md:col-span-4 rounded-xl p-4 bg-slate-950/70 border border-white/10 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-400 animate-spin' : 'text-slate-400'}`} />
                  Next Message In
                </span>
                {isRunning && (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>

              <div className="my-2 text-center py-1">
                {isRunning ? (
                  timeLeftSec > 0 ? (
                    <div className="space-y-0.5">
                      <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-lime-400 font-mono tracking-wider">
                        {formatCountdown(timeLeftSec)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {timeLeftSec} second{timeLeftSec === 1 ? '' : 's'} remaining
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <p className="text-2xl font-black text-emerald-400 animate-pulse">
                        Transmitting...
                      </p>
                      <p className="text-[10px] text-slate-400">Sending to recipient device</p>
                    </div>
                  )
                ) : (
                  <div className="space-y-0.5">
                    <p className="text-2xl font-black text-slate-400">00:00</p>
                    <p className="text-[10px] text-slate-500">Queue is idle</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Pacing Speed</span>
                <span className="font-bold text-white capitalize">
                  {campaign?.speedPreset ? campaign.speedPreset.replace('_', ' ') : 'Human Safe'}
                </span>
              </div>
            </div>

            {/* Box 2: CURRENT TARGET & LAST SENT PHONE NUMBER */}
            <div className="md:col-span-4 rounded-xl p-4 bg-slate-950/70 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-400" />
                {isRunning ? 'Currently Dispatching' : 'Last Sent Contact'}
              </span>

              <div className="my-2">
                {currentRec?.phone ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <p className="text-base font-black text-white font-mono tracking-wide truncate">
                        {currentRec.phone}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-300 truncate">
                      {currentRec.name || 'Valued Lead'}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Recipient #{currentRec.index} of {total})
                      </span>
                    </p>
                  </div>
                ) : campaign?.lastSentPhone ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <p className="text-base font-black text-white font-mono tracking-wide truncate">
                        {campaign.lastSentPhone}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-300 truncate">
                      {campaign.lastSentName || 'Delivered Contact'}{' '}
                      <span className="text-[10px] text-emerald-400 font-normal">
                        (Successfully Sent)
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    Waiting for first recipient...
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Delivery Status</span>
                <span className="font-bold text-emerald-400">
                  {isRunning ? 'Sending Active' : (campaign?.status || 'Done')}
                </span>
              </div>
            </div>

            {/* Box 3: NEXT UPCOMING RECIPIENT */}
            <div className="md:col-span-4 rounded-xl p-4 bg-slate-950/70 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                Next In Line
              </span>

              <div className="my-2">
                {nextRec?.phone ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <p className="text-base font-black text-amber-300 font-mono tracking-wide truncate">
                        {nextRec.phone}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-300 truncate">
                      {nextRec.name || 'Upcoming Contact'}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        (Queued #{nextRec.index} of {total})
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic py-2">
                    {isRunning ? 'Final recipient in queue' : 'No upcoming queue'}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Remaining Queue</span>
                <span className="font-bold text-white font-mono">
                  {Math.max(0, total - processed)} contacts
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar & Counters */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">
                Overall Broadcast Progress: <span className="text-white">{progressPercent}%</span>
              </span>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="text-emerald-400">✓ {success} Sent</span>
                <span className="text-rose-400">✕ {failed} Failed</span>
                <span className="text-slate-400">⏳ {Math.max(0, total - processed)} Pending</span>
              </div>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-white/10 p-0.5">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FULL RECIPIENTS QUEUE MODAL */}
      {showQueueModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ListOrdered className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Live Broadcast Queue & Delivery Tracker
                  </h3>
                  <p className="text-xs text-slate-400">
                    Campaign: {campaign?.title || 'Broadcast'} • {total} total numbers scheduled
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary KPI */}
            <div className="grid grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-center text-xs">
              <div className="p-2 bg-slate-800/60 rounded-xl border border-white/5">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Contacts</p>
                <p className="text-lg font-black text-white">{total}</p>
              </div>
              <div className="p-2 bg-emerald-950/30 rounded-xl border border-emerald-500/20">
                <p className="text-[10px] uppercase font-bold text-emerald-400">Delivered</p>
                <p className="text-lg font-black text-emerald-400">{success}</p>
              </div>
              <div className="p-2 bg-rose-950/30 rounded-xl border border-rose-500/20">
                <p className="text-[10px] uppercase font-bold text-rose-400">Failed</p>
                <p className="text-lg font-black text-rose-400">{failed}</p>
              </div>
              <div className="p-2 bg-amber-950/30 rounded-xl border border-amber-500/20">
                <p className="text-[10px] uppercase font-bold text-amber-400">Remaining In Queue</p>
                <p className="text-lg font-black text-amber-400">{Math.max(0, total - processed)}</p>
              </div>
            </div>

            {/* Queue Table */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-700">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Recipient Name</th>
                      <th className="p-3">Phone Number</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Timestamp / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {campaign?.recipients && campaign.recipients.length > 0 ? (
                      campaign.recipients.map((r, idx) => {
                        const isCurrent = currentRec?.phone === r.phone;
                        const isNext = nextRec?.phone === r.phone;

                        return (
                          <tr
                            key={r._id || idx}
                            className={`transition-colors ${
                              isCurrent
                                ? 'bg-blue-500/15 font-bold'
                                : isNext
                                ? 'bg-amber-500/10'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-white flex items-center gap-1.5">
                              <span>{r.name || 'Valued Lead'}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500 text-white font-black">
                                  ACTIVE
                                </span>
                              )}
                              {isNext && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500 text-slate-950 font-black">
                                  NEXT
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-emerald-300 font-bold">
                              {r.phone}
                            </td>
                            <td className="p-3 text-slate-400">{r.company || '—'}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                  r.status === 'SENT'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : r.status === 'SENDING' || isCurrent
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse'
                                    : r.status === 'FAILED'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : isNext
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {r.status === 'SENT' && '✓ SENT'}
                                {(r.status === 'SENDING' || isCurrent) && '● SENDING'}
                                {r.status === 'FAILED' && '✕ FAILED'}
                                {r.status === 'PENDING' && (isNext ? '⏳ NEXT UP' : 'QUEUED')}
                              </span>
                            </td>
                            <td className="p-3 text-[11px] text-slate-400">
                              {r.error ? (
                                <span className="text-rose-400">{r.error}</span>
                              ) : r.sentAt ? (
                                new Date(r.sentAt).toLocaleTimeString()
                              ) : isCurrent ? (
                                <span className="text-blue-300 font-semibold">Simulating presence & dispatching...</span>
                              ) : isNext && isRunning ? (
                                <span className="text-amber-300 font-semibold">Scheduled in {timeLeftSec}s</span>
                              ) : (
                                'Waiting in queue'
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          No recipient details logged for this campaign.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
              <span className="text-xs text-slate-400">
                Live queue refreshes automatically as messages are delivered.
              </span>
              <button
                onClick={() => setShowQueueModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
              >
                Close Queue View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WhatsAppLiveTracker;
