import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Calendar,
  Clock,
  Paperclip,
  Tag,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Users,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Eye,
  PenTool
} from 'lucide-react';
import { Modal } from './Modal';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const ComposeEmailModal = ({
  isOpen,
  onClose,
  initialTo = '',
  initialSubject = '',
  initialBody = '',
  leadId = null,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();

  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Signature state
  const [signature, setSignature] = useState('');
  const [includeSignature, setIncludeSignature] = useState(true);
  const [bodyTab, setBodyTab] = useState('edit'); // 'edit' | 'preview'

  // Schedule email state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  // Leads dropdown for quick autocomplete
  const [leadOptions, setLeadOptions] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(leadId);

  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTo(initialTo || '');
      setSubject(initialSubject || '');
      setBody(initialBody || '');
      setSelectedLeadId(leadId);
      setIsScheduled(false);
      setScheduledFor('');
      fetchLeads();
      fetchUserSignature();
    }
  }, [isOpen, initialTo, initialSubject, initialBody, leadId]);

  const fetchUserSignature = async () => {
    try {
      const res = await api.get('/users/smtp-config');
      if (res.data?.success && res.data.smtpConfig) {
        setSignature(res.data.smtpConfig.signature || '');
        if (res.data.smtpConfig.includeSignature !== undefined) {
          setIncludeSignature(Boolean(res.data.smtpConfig.includeSignature));
        }
      }
    } catch (err) {
      // Non-blocking
    }
  };

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const res = await api.get('/leads', { params: { limit: 100 } });
      if (res.data?.success && Array.isArray(res.data.leads)) {
        setLeadOptions(res.data.leads.filter(l => Boolean(l.email)));
      }
    } catch (err) {
      // Non-blocking
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleSelectLead = (lead) => {
    if (!lead) return;
    setTo(lead.email);
    setSelectedLeadId(lead._id);
    if (!subject) {
      setSubject(`Inquiry for ${lead.companyName || lead.name}`);
    }
  };

  const handleInsertTag = (tag) => {
    setBody(prev => prev + ` {{${tag}}} `);
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
    if (!rawText && !signature) {
      return '<p style="color: #94a3b8; font-style: italic;">(Email body is empty...)</p>';
    }

    let interpolated = rawText || '';
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

    const signatureHtml = (includeSignature && signature)
      ? `<div style="margin-top: 20px; padding-top: 14px; border-top: 1px solid #e2e8f0;">${signature}</div>`
      : '';

    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b;">${bodyFormatted}${signatureHtml}</div>`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!to || !to.trim()) {
      showError('Please enter at least one recipient email address');
      return;
    }

    if (!subject || !subject.trim()) {
      showError('Please enter an email subject');
      return;
    }

    if (!body || !body.trim()) {
      showError('Email body cannot be empty');
      return;
    }

    if (isScheduled && (!scheduledFor || new Date(scheduledFor) <= new Date())) {
      showError('Please select a valid future date and time to schedule this email');
      return;
    }

    setSending(true);

    try {
      const payload = {
        to: to.trim(),
        cc: cc.trim() || undefined,
        bcc: bcc.trim() || undefined,
        subject: subject.trim(),
        body: body.trim(),
        signature,
        includeSignature,
        scheduledFor: isScheduled ? scheduledFor : undefined,
        leadId: selectedLeadId || undefined
      };

      const res = await api.post('/emails/send', payload);

      if (res.data?.success) {
        showSuccess(res.data.message || 'Email sent successfully!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to send email. Check your SMTP settings in Settings.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose Email"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick Lead Autocomplete Selector */}
        {leadOptions.length > 0 && (
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Users className="w-3.5 h-3.5 text-crm-lime" />
              <span>CRM Lead:</span>
            </span>
            <select
              onChange={(e) => {
                const found = leadOptions.find(l => l._id === e.target.value);
                if (found) handleSelectLead(found);
              }}
              defaultValue=""
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-hidden"
            >
              <option value="" disabled>Select a lead to auto-fill recipient...</option>
              {leadOptions.map(l => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.companyName || 'No Company'}) — {l.email}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* To Field */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700">To <span className="text-rose-500">*</span></label>
            <div className="flex items-center gap-2 text-[11px]">
              {!showCc && (
                <button
                  type="button"
                  onClick={() => setShowCc(true)}
                  className="text-slate-500 hover:text-crm-navy font-bold"
                >
                  + CC
                </button>
              )}
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="text-slate-500 hover:text-crm-navy font-bold"
                >
                  + BCC
                </button>
              )}
            </div>
          </div>
          <input
            type="text"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com, second@example.com"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
          />
        </div>

        {/* CC Field */}
        {showCc && (
          <div className="animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600">CC</label>
              <button
                type="button"
                onClick={() => { setShowCc(false); setCc(''); }}
                className="text-[10px] text-slate-400 hover:text-rose-500 font-bold"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="cc@example.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>
        )}

        {/* BCC Field */}
        {showBcc && (
          <div className="animate-in fade-in duration-150">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600">BCC</label>
              <button
                type="button"
                onClick={() => { setShowBcc(false); setBcc(''); }}
                className="text-[10px] text-slate-400 hover:text-rose-500 font-bold"
              >
                Remove
              </button>
            </div>
            <input
              type="text"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder="bcc@example.com"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
            />
          </div>
        )}

        {/* Subject Field */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Subject <span className="text-rose-500">*</span></label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Follow up on our conversation / Partnership inquiry"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
          />
        </div>

        {/* Template Variables Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Tags:
          </span>
          {['name', 'companyName', 'decisionMaker', 'service', 'city', 'phone'].map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => handleInsertTag(tag)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-mono font-bold transition-colors"
            >
              {`{{${tag}}}`}
            </button>
          ))}
        </div>

        {/* Email Body with Formatting & Live Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              Message Body <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setBodyTab('edit')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  bodyTab === 'edit' ? 'bg-white text-crm-navy shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PenTool className="w-3 h-3 text-crm-lime" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setBodyTab('preview')}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  bodyTab === 'preview' ? 'bg-crm-navy text-white shadow-2xs font-extrabold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3 h-3 text-crm-lime" />
                Live Preview
              </button>
            </div>
          </div>

          {bodyTab === 'edit' ? (
            <div className="space-y-1.5">
              {/* Quick Format toolbar */}
              <div className="flex items-center gap-1 flex-wrap p-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                <button
                  type="button"
                  onClick={() => insertFormatting('bold')}
                  title="Bold"
                  className="p-1 px-1.5 hover:bg-white rounded font-bold text-xs"
                >
                  <Bold className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('italic')}
                  title="Italic"
                  className="p-1 px-1.5 hover:bg-white rounded italic text-xs"
                >
                  <Italic className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('bullet')}
                  title="Bullet List"
                  className="p-1 px-1.5 hover:bg-white rounded text-xs flex items-center gap-0.5"
                >
                  <List className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('numbered')}
                  title="Numbered List"
                  className="p-1 px-1.5 hover:bg-white rounded text-xs flex items-center gap-0.5"
                >
                  <ListOrdered className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('link')}
                  title="Link"
                  className="p-1 px-1.5 hover:bg-white rounded text-xs flex items-center gap-0.5"
                >
                  <Link2 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('line')}
                  title="Paragraph Break"
                  className="p-1 px-1.5 hover:bg-white rounded text-[10px] font-bold"
                >
                  ¶ Paragraph
                </button>
              </div>

              <textarea
                rows="6"
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your email message here... Supports HTML, linebreaks, and bullet lists."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy font-sans"
              />
            </div>
          ) : (
            <div
              className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs min-h-[140px]"
              dangerouslySetInnerHTML={{ __html: getPreviewHtml(body) }}
            />
          )}
        </div>

        {/* Signature Toggle Card */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="w-4 h-4 rounded text-crm-navy focus:ring-crm-navy border-slate-300"
            />
            <Sparkles className="w-3.5 h-3.5 text-crm-lime" />
            <span>Include Outlook / Email Signature</span>
          </label>

          {includeSignature && signature && (
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
              Signature Attached
            </span>
          )}
        </div>

        {/* Scheduling Option */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4 h-4 rounded text-crm-navy focus:ring-crm-navy border-slate-300"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Schedule email for later</span>
          </label>

          {isScheduled && (
            <div className="pl-6 animate-in fade-in duration-150">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Send Date & Time:</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-crm-navy/20"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            Sends via your configured SMTP / Microsoft 365
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Discard
            </button>

            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 bg-crm-navy hover:bg-crm-navy-light text-crm-lime text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-crm-lime border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isScheduled ? 'Schedule Email' : 'Send Email'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
