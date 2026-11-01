import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ArrowRight, Sparkles, Zap, Bot, ArrowRightCircle } from 'lucide-react';

export const QuickWorkflowBar: React.FC = () => {
  const navigate = useNavigate();

  const workflows = [
    {
      id: 'wf_1',
      title: 'Scrape Leads → Generate Pitch Website',
      description: 'Grab business leads from Google Maps/LinkedIn and autonomously generate a custom landing page to pitch them.',
      badge: 'Cross-App Synergy',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      actionText: 'Execute Workflow',
      route: '/apps/crm'
    },
    {
      id: 'wf_2',
      title: 'Run Diagnostic → Auto-Schedule Campaign',
      description: 'Conduct STRATIQ business diagnostic and automatically draft a 30-day social media plan addressing identified growth pillars.',
      badge: 'AI Strategy Pipeline',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
      actionText: 'Launch Strategy',
      route: '/apps/analytics'
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Unified Cross-Application Automations
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          Connected Ecosystem
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg border border-indigo-900/40 flex flex-col justify-between space-y-4"
          >
            <div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${wf.badgeColor} mb-2`}>
                {wf.badge}
              </span>
              <h4 className="text-sm font-bold text-white tracking-tight">
                {wf.title}
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {wf.description}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-indigo-300 font-semibold flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>Zero Context Switching</span>
              </span>
              <button
                onClick={() => navigate(wf.route)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
              >
                <span>{wf.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

