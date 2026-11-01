import React, { useState } from 'react';
import { X, Plus, Sparkles, Layers, Globe, Shield, Check } from 'lucide-react';

interface ModuleRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (appData: any) => void;
}

export const ModuleRegistryModal: React.FC<ModuleRegistryModalProps> = ({
  isOpen,
  onClose,
  onRegister
}) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    category: 'Marketing',
    tagline: '',
    description: '',
    defaultUrl: 'http://localhost:5185',
    icon: 'Layers'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      ...formData,
      id: formData.name.toLowerCase().replace(/\s+/g, '-'),
      slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      badge: 'Custom Module',
      badgeColor: 'bg-emerald-50 text-emerald-700',
      status: 'active',
      features: ['Central Navigation', 'Unified Authentication', 'Cross-App Workflows'],
      quickActions: []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Register New Application Module
            </h3>
            <p className="text-xs text-slate-400">
              Integrate a new micro-frontend or external tool into your platform
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Application Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. AI Voice Calling Agent"
              className="w-full mt-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
              >
                <option value="Sales Automation">Sales Automation</option>
                <option value="Marketing">Marketing</option>
                <option value="Search & Traffic">Search & Traffic</option>
                <option value="Advertising">Advertising</option>
                <option value="Operations">Operations</option>
                <option value="AI & Intelligence">AI & Intelligence</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Service URL / Port</label>
              <input
                type="text"
                required
                value={formData.defaultUrl}
                onChange={e => setFormData({ ...formData, defaultUrl: e.target.value })}
                placeholder="http://localhost:5185"
                className="w-full mt-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tagline</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="e.g. Ultra-low latency conversational AI phone agents"
              className="w-full mt-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of application features and workflow..."
              className="w-full mt-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Register & Launch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

