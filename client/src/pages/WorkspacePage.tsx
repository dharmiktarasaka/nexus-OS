import React from 'react';
import { Building, ShieldCheck, Database, CheckCircle2, Users, Layers, ExternalLink } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAuth } from '../context/AuthContext';

export const WorkspacePage: React.FC = () => {
  const { currentWorkspace, workspaces, switchWorkspace } = useWorkspace();
  const { user } = useAuth();

  const services = [
    { name: 'Lead Management CRM Server', url: 'http://localhost:5001', db: 'MongoDB Atlas (Cluster0)', status: 'Connected & Operational' },
    { name: 'Mediamation Social Publisher', url: 'http://localhost:5000', db: 'MongoDB / Cloud Scheduler', status: 'Connected & Operational' },
    { name: 'AI Website Studio Engine', url: 'http://localhost:5002', db: 'MongoDB Atlas (Pulse Studio)', status: 'Connected & Operational' },
    { name: 'STRATIQ Business Advisor', url: 'http://localhost:5003', db: 'MongoDB Atlas (Stratiq DB)', status: 'Connected & Operational' }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Workspace & Ecosystem Health
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Workspace tenant configuration, connected clusters, and micro-frontend status
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Workspace Identity Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-base">
            {currentWorkspace.initials}
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {currentWorkspace.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <strong className="text-indigo-600 dark:text-indigo-400">{currentWorkspace.role}</strong> • Plan: {currentWorkspace.plan}
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Administrator:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.displayName}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Primary Email:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Security Standard:</span>
              <span className="font-semibold text-emerald-600">Enterprise Encrypted</span>
            </div>
          </div>
        </div>

        {/* Switch Organization Workspaces */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Switch Business Workspace
          </h3>
          <p className="text-xs text-slate-500">
            Each workspace operates in isolation while sharing centralized authentication and SSO permissions.
          </p>

          <div className="space-y-3 pt-2">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => switchWorkspace(ws.id)}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  ws.id === currentWorkspace.id
                    ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                    {ws.initials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{ws.name}</p>
                    <p className="text-[11px] text-slate-500">{ws.role} • {ws.plan}</p>
                  </div>
                </div>

                {ws.id === currentWorkspace.id ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    Active
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 hover:text-indigo-600">
                    Switch
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Connected Services & Clusters Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Underlying Database Clusters & Microservices
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Database Cluster</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {services.map((svc) => (
                <tr key={svc.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {svc.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                    {svc.db}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-subtle" />
                      <span>{svc.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline-block" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

