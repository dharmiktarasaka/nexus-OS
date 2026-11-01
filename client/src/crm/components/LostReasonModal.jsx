import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

const REASON_OPTIONS = [
  'Price too high',
  'Competitor selected',
  'No response',
  'Not interested',
  'Project cancelled',
  'Timing issue',
  'Wrong lead',
  'Other'
];

export const LostReasonModal = ({ isOpen, onClose, onSubmit, leadName }) => {
  const [selectedReason, setSelectedReason] = useState('Price too high');
  const [otherText, setOtherText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedReason === 'Other' ? (otherText.trim() || 'Other') : selectedReason;
    onSubmit(finalReason);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mark Lead as Lost">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">
            Please indicate why <span className="font-bold">{leadName || 'this lead'}</span> was lost. This helps improve sales pipeline analytics.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-crm-text mb-2">Select Lost Reason *</label>
          <div className="grid grid-cols-2 gap-2.5">
            {REASON_OPTIONS.map((reason) => (
              <button
                key={reason}
                type="button"
                onClick={() => setSelectedReason(reason)}
                className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all ${
                  selectedReason === reason
                    ? 'border-rose-500 bg-rose-50/50 text-rose-700 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>

        {selectedReason === 'Other' && (
          <div className="animate-in fade-in duration-150">
            <label className="block text-xs font-semibold text-crm-text mb-1">Please specify custom reason *</label>
            <textarea
              required
              rows={3}
              value={otherText}
              onChange={(e) => setOtherText(e.target.value)}
              placeholder="Provide details about why the lead was disqualified..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-sm"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all"
          >
            Save Lost Reason
          </button>
        </div>
      </form>
    </Modal>
  );
};
