import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  ArrowRight,
  BarChart3,
  Target
} from 'lucide-react';
import { api } from '../../services/api';

export const AnalyticsHub: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await api.getAnalyticsReports();
        setReports(res.reports || []);
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };
    loadReports();
  }, []);

  const pillars = [
    { name: 'Marketing & Sales', score: 88, icon: Target, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
    { name: 'Operations & Delivery', score: 92, icon: Layers, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
    { name: 'Finance & Margins', score: 84, icon: TrendingUp, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
    { name: 'Technology & AI', score: 95, icon: Sparkles, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' }
  ];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* 4 Pillars Strategic Diagnostic Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-purple-900/40 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              STRATIQ Enterprise Advisor
            </span>
            <h2 className="text-xl font-extrabold text-white">
              Executive Business Diagnostics & Intelligence
            </h2>
            <p className="text-xs text-purple-200">
              Evaluate your business health score across 4 operational pillars using Google Gemini AI.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-4 shrink-0">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-300">Composite Health Score</p>
              <p className="text-3xl font-extrabold text-white">89.8<span className="text-sm font-normal text-purple-300">/100</span></p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/40">
              TOP 5%
            </div>
          </div>
        </div>

        {/* 4 Operational Pillars Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.name}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2 backdrop-blur-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 truncate">{pillar.name}</span>
                  <span className="text-xs font-extrabold text-white">{pillar.score}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${pillar.score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SWOT Strategic Matrix */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Active SWOT Strategic Intelligence
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" />
              <span>Core Strengths</span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>High-velocity omni-channel automated lead pipeline.</li>
              <li>Proprietary Gemini AI landing page generation studio.</li>
              <li>Integrated client retention system with 94% satisfaction.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Growth Vulnerabilities</span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Cold outreach reply rate relies heavily on single domain warming.</li>
              <li>Customer success onboarding requires more self-serve interactive guides.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 space-y-2">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Market Opportunities</span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Expanding AI voice qualification agent into European markets.</li>
              <li>White-label agency tier for high-ticket marketing agencies.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Risk Safeguards</span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
              <li>Social network API quota changes mitigated by proxy rotation.</li>
              <li>Automated database backups across independent AWS regions.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Generated Executive Diagnostic Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Executive Diagnostic Reports
          </h3>
          <span className="text-xs text-slate-400">PDF & Excel Available</span>
        </div>

        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report._id}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {report.businessName} Diagnostic Report
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Industry: {report.industry || 'Enterprise'} • Health Score: {report.overallScore}/100 • {report.recommendationsCount || 12} Action Items
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Downloading Executive PDF Report for ${report.businessName}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

