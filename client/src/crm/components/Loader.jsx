import React from 'react';

export const Loader = ({ message = 'Loading CRM data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 w-full text-slate-400">
      <div className="w-10 h-10 border-3 border-crm-lime/30 border-t-crm-navy rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-semibold text-slate-500">{message}</p>
    </div>
  );
};
