import React, { useState } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Eye,
  Edit,
  Trash2,
  SlidersHorizontal,
  X,
  Search,
  Mail,
  Smartphone
} from 'lucide-react';
import { Loader } from './Loader';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

export const DynamicTable = ({
  headers = [],
  records = [],
  loading = false,
  pagination = { page: 1, totalPages: 1, total: 0, limit: 10 },
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
  columnFilters = {},
  onColumnFilterChange,
  selectedRecordIds = [],
  onSelectRow,
  onSelectAll,
  onEditRecord,
  onDeleteRecord,
  onAddRecordClick,
  onSendEmailClick,
  onSendWhatsAppClick
}) => {
  // Column Visibility state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const map = {};
    headers.forEach(h => { map[h.key] = true; });
    return map;
  });

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [activeFilterColumn, setActiveFilterColumn] = useState(null);

  // Sync headers into visibleColumns if headers change
  React.useEffect(() => {
    setVisibleColumns(prev => {
      const updated = { ...prev };
      headers.forEach(h => {
        if (updated[h.key] === undefined) updated[h.key] = true;
      });
      return updated;
    });
  }, [headers]);

  const activeHeaders = headers.filter(h => visibleColumns[h.key] !== false);
  const allSelected = records.length > 0 && records.every(r => selectedRecordIds.includes(r._id));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-4">
      {/* Table Action Bar: Column Selector & Active Filters Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-crm-navy">Showing {activeHeaders.length} of {headers.length} Columns</span>
        </div>

        <div className="flex items-center gap-2">
          {onSendWhatsAppClick && (
            <button
              onClick={onSendWhatsAppClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition-all shadow-xs"
              title="Broadcast personalized WhatsApp messages to Excel contacts"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Send WhatsApp
            </button>
          )}

          {onSendEmailClick && (
            <button
              onClick={onSendEmailClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-crm-navy text-white font-extrabold hover:bg-crm-navy-light transition-all shadow-xs"
              title="Extract table data and send emails using SMTP"
            >
              <Mail className="w-3.5 h-3.5 text-crm-lime" />
              Send Email
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-crm-navy font-bold hover:bg-slate-200 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Columns Visibility
            </button>

            {/* Column Toggle Dropdown Menu */}
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-extrabold text-xs text-crm-navy">Toggle Table Columns</span>
                  <button onClick={() => setShowColumnMenu(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {headers.map(h => (
                    <label key={h.key} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={visibleColumns[h.key] !== false}
                        onChange={(e) => setVisibleColumns({ ...visibleColumns, [h.key]: e.target.checked })}
                        className="rounded text-crm-navy focus:ring-crm-navy/20"
                      />
                      <span className="truncate">{h.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Responsive Table */}
      {loading ? (
        <Loader message="Loading dynamic dataset records..." />
      ) : records.length === 0 ? (
        <EmptyState
          title="No records found"
          description="There are no records in this dataset matching your criteria."
          actionButton={
            onAddRecordClick && (
              <button
                onClick={onAddRecordClick}
                className="px-4 py-2 text-xs font-bold text-crm-navy bg-crm-lime rounded-xl hover:bg-crm-lime-hover shadow-xs"
              >
                + Add First Record
              </button>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                {/* Select All Checkbox */}
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    className="rounded text-crm-navy focus:ring-crm-navy/20"
                  />
                </th>

                {/* Sequential Row Index # */}
                <th className="py-3 px-3 w-12 text-center text-slate-400 font-extrabold text-[10px]">
                  #
                </th>

                {/* Dynamic Columns */}
                {activeHeaders.map(h => {
                  const isSorted = sortBy === h.key;
                  const filterVal = columnFilters[h.key] || '';

                  return (
                    <th key={h.key} className="py-3 px-4 relative group whitespace-nowrap">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          onClick={() => onSortChange && onSortChange(h.key)}
                          className="cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-1 font-extrabold"
                        >
                          {h.label}
                          {isSorted ? (
                            sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                          )}
                        </span>

                        {/* Column Filter Toggle Button */}
                        <button
                          onClick={() => setActiveFilterColumn(activeFilterColumn === h.key ? null : h.key)}
                          className={`p-1 rounded-md transition-colors ${filterVal ? 'bg-crm-lime text-crm-navy font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                          title={`Filter by ${h.label}`}
                        >
                          <Filter className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Column Filter Popover */}
                      {activeFilterColumn === h.key && (
                        <div className="absolute left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2.5 space-y-2">
                          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Filter {h.label}</span>
                            <button onClick={() => setActiveFilterColumn(null)} className="text-slate-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={filterVal}
                            onChange={(e) => onColumnFilterChange && onColumnFilterChange(h.key, e.target.value)}
                            placeholder="Filter value..."
                            className="w-full px-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200"
                            autoFocus
                          />
                        </div>
                      )}
                    </th>
                  );
                })}

                {/* Actions Column */}
                <th className="py-3 px-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {records.map((rec, idx) => {
                const isSelected = selectedRecordIds.includes(rec._id);
                const dataObj = rec.data || {};
                const rowNumber = ((pagination?.page || 1) - 1) * (pagination?.limit || 10) + idx + 1;

                return (
                  <tr key={rec._id} className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-crm-lime/10' : ''}`}>
                    {/* Checkbox */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow && onSelectRow(rec._id)}
                        className="rounded text-crm-navy focus:ring-crm-navy/20"
                      />
                    </td>

                    {/* Sequential Row Index # */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400 font-bold">
                      {rowNumber}
                    </td>

                    {/* Dynamic Cell Values */}
                    {activeHeaders.map(h => {
                      const val = dataObj[h.key];
                      const displayVal = val !== undefined && val !== null ? String(val) : '—';

                      return (
                        <td key={h.key} className="py-3 px-4 max-w-xs truncate text-slate-700 font-medium" title={displayVal}>
                          {h.type === 'URL' && displayVal.startsWith('http') ? (
                            <a href={displayVal} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                              {displayVal}
                            </a>
                          ) : h.type === 'EMAIL' ? (
                            <a href={`mailto:${displayVal}`} className="text-blue-600 hover:underline">
                              {displayVal}
                            </a>
                          ) : (
                            displayVal
                          )}
                        </td>
                      );
                    })}

                    {/* Edit / Delete Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditRecord && onEditRecord(rec)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Record"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord && onDeleteRecord(rec._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          limit={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
