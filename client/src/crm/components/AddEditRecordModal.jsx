import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import {
  Plus,
  Trash2,
  Database,
  Check,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export const AddEditRecordModal = ({
  isOpen,
  onClose,
  datasetId,
  datasets = [],
  headers = [],
  record = null,
  onSuccess
}) => {
  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [fields, setFields] = useState([]);

  // Resolve active dataset and available column name suggestions
  const activeDataset = datasets.find(d => String(d._id) === String(selectedDatasetId)) || datasets[0];
  const activeHeaders = (activeDataset && activeDataset.headers?.length > 0)
    ? activeDataset.headers
    : (headers.length > 0 ? headers : []);

  // List of existing column labels for autocomplete / suggestions
  const columnSuggestions = activeHeaders.map(h => h.label);

  useEffect(() => {
    if (isOpen) {
      const initialDsId = datasetId || (datasets.length > 0 ? datasets[0]._id : '');
      setSelectedDatasetId(initialDsId);

      if (record && record.data && Object.keys(record.data).length > 0) {
        // Edit mode: Populate with the record's existing fields
        const existingFields = Object.entries(record.data).map(([k, val], idx) => {
          // Find matching header label if available
          const matchedHeader = activeHeaders.find(h => h.key === k);
          const label = matchedHeader ? matchedHeader.label : k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return {
            id: `field_${idx}_${Date.now()}`,
            columnName: label,
            value: val !== undefined && val !== null ? String(val) : ''
          };
        });
        setFields(existingFields.length > 0 ? existingFields : [
          { id: `field_0_${Date.now()}`, columnName: columnSuggestions[0] || 'Name', value: '' }
        ]);
      } else {
        // Add mode: ONLY show ONE field row initially as requested
        const defaultColName = columnSuggestions[0] || 'Name';
        setFields([
          {
            id: `field_0_${Date.now()}`,
            columnName: defaultColName,
            value: ''
          }
        ]);
      }
    }
  }, [isOpen, record, datasetId, datasets]);

  // Handle changing column name or value
  const handleFieldChange = (index, prop, val) => {
    setFields(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [prop]: val };
      return copy;
    });
  };

  // Add another field row
  const handleAddField = () => {
    // Pick the next unused suggestion if available, otherwise blank
    const usedNames = new Set(fields.map(f => (f.columnName || '').trim().toLowerCase()));
    const nextSuggested = columnSuggestions.find(s => !usedNames.has(s.toLowerCase())) || '';

    setFields(prev => [
      ...prev,
      {
        id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        columnName: nextSuggested,
        value: ''
      }
    ]);
  };

  // Remove a field row
  const handleRemoveField = (index) => {
    if (fields.length <= 1) return;
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataPayload = {};

      fields.forEach(f => {
        const rawCol = (f.columnName || '').trim();
        if (!rawCol) return;

        // Match against existing header by label or key (case-insensitive)
        const match = activeHeaders.find(
          h => h.label.toLowerCase() === rawCol.toLowerCase() || h.key.toLowerCase() === rawCol.toLowerCase()
        );

        const key = match ? match.key : rawCol.toLowerCase().replace(/[^a-z0-9_]+/g, '_');
        dataPayload[key] = f.value !== undefined && f.value !== null ? String(f.value).trim() : '';
      });

      if (Object.keys(dataPayload).length === 0) {
        showError('Please enter at least one column name and value');
        setSubmitting(false);
        return;
      }

      if (record?._id) {
        await api.put(`/folders/records/${record._id}`, { data: dataPayload });
        showSuccess('Record updated successfully');
      } else {
        const targetId = selectedDatasetId || datasetId || datasets[0]?._id;
        if (!targetId) {
          showError('Please select a dataset to add this record');
          setSubmitting(false);
          return;
        }
        await api.post(`/folders/datasets/${targetId}/records`, { data: dataPayload });
        showSuccess('Record added successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={record ? 'Edit Record' : 'Add New Record'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dataset Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-crm-lime/20 text-crm-navy flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-crm-navy" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-crm-navy">
                {record ? 'Edit Record Data' : 'Add Record'}
              </p>
              <p className="text-[11px] text-slate-500">
                {activeDataset ? (
                  <>Dataset: <span className="font-bold text-slate-700">{activeDataset.fileName || activeDataset.name || 'Default Dataset'}</span></>
                ) : (
                  'Default Dataset'
                )}
              </p>
            </div>
          </div>

          {/* Dataset Switcher if multiple datasets exist */}
          {datasets.length > 1 && !record && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">Dataset:</span>
              <select
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-crm-navy focus:ring-2 focus:ring-crm-navy/20"
              >
                {datasets.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.fileName || d.name || 'Dataset'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dynamic Fields List */}
        <div className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-1">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="p-3 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 group focus-within:border-crm-navy/40 focus-within:bg-white focus-within:shadow-xs"
            >
              {/* Column Name Input (User Can Modify Anytime) */}
              <div className="sm:w-5/12 space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Column Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list={`col-suggestions-${field.id}`}
                    value={field.columnName}
                    onChange={(e) => handleFieldChange(idx, 'columnName', e.target.value)}
                    placeholder="Enter column name..."
                    className="w-full px-3 py-2 text-xs font-bold text-crm-navy bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                  />
                  {columnSuggestions.length > 0 && (
                    <datalist id={`col-suggestions-${field.id}`}>
                      {columnSuggestions.map((col, cIdx) => (
                        <option key={cIdx} value={col} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>

              {/* Value Input */}
              <div className="flex-1 space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Value
                </label>
                <input
                  type="text"
                  value={field.value}
                  onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                  placeholder={`Enter ${field.columnName || 'value'}...`}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-crm-navy/20 focus:border-crm-navy"
                />
              </div>

              {/* Delete Button (when more than 1 field exists) */}
              {fields.length > 1 && (
                <div className="sm:self-end pb-0.5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove this field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* + Add Field Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleAddField}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-crm-navy text-xs font-extrabold rounded-xl transition-all shadow-2xs"
          >
            <Plus className="w-4 h-4 text-crm-lime" />
            + Add Field
          </button>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 font-medium">
            {fields.length} field{fields.length > 1 ? 's' : ''} to save
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || fields.every(f => !f.columnName.trim())}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-crm-navy border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {record ? 'Update Record' : 'Save Record'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
