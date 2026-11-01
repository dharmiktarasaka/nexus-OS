import React from 'react';

const statusStyles = {
  NEW: 'bg-slate-100 text-slate-800 border-slate-200',
  CONTACTED: 'bg-blue-50 text-blue-700 border-blue-200',
  INTERESTED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  QUALIFIED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MEETING: 'bg-purple-50 text-purple-700 border-purple-200',
  PROPOSAL_SENT: 'bg-amber-50 text-amber-800 border-amber-200',
  NEGOTIATION: 'bg-orange-50 text-orange-800 border-orange-200',
  WON: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
  LOST: 'bg-rose-50 text-rose-700 border-rose-200'
};

const priorityStyles = {
  LOW: 'bg-slate-50 text-slate-600 border-slate-200',
  MEDIUM: 'bg-blue-50 text-blue-600 border-blue-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-200',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
};

export const StatusBadge = ({ status }) => {
  const label = status ? status.replace('_', ' ') : 'NEW';
  const style = statusStyles[status] || statusStyles.NEW;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-75"></span>
      {label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const label = priority || 'MEDIUM';
  const style = priorityStyles[priority] || priorityStyles.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
};
