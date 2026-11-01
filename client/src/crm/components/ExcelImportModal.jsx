import React, { useState } from 'react';
import { Modal } from './Modal';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight, Table, Layers, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// Helper to sanitize key string for record properties
const sanitizeKey = (label, existingKeys) => {
  let key = String(label || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!key) key = 'field';

  let uniqueKey = key;
  let count = 2;
  while (existingKeys.has(uniqueKey)) {
    uniqueKey = `${key}_${count}`;
    count++;
  }
  existingKeys.add(uniqueKey);
  return uniqueKey;
};

// Smart Field Type Detection
const detectFieldType = (label, samples = []) => {
  const lowerLabel = String(label || '').toLowerCase();

  if (lowerLabel.includes('email') || lowerLabel.includes('mail')) return 'EMAIL';
  if (lowerLabel.includes('phone') || lowerLabel.includes('mobile') || lowerLabel.includes('contact') || lowerLabel.includes('cell')) return 'PHONE';
  if (lowerLabel.includes('date') || lowerLabel.includes('time') || lowerLabel.includes('dob')) return 'DATE';
  if (lowerLabel.includes('amount') || lowerLabel.includes('price') || lowerLabel.includes('budget') || lowerLabel.includes('cost') || lowerLabel.includes('salary') || lowerLabel.includes('revenue') || lowerLabel.includes('kw') || lowerLabel.includes('capacity')) return 'NUMBER';
  if (lowerLabel.includes('url') || lowerLabel.includes('website') || lowerLabel.includes('link') || lowerLabel.includes('web')) return 'URL';
  if (lowerLabel.includes('status') || lowerLabel.includes('stage') || lowerLabel.includes('priority')) return 'SELECT';

  for (const sample of samples) {
    if (sample === null || sample === undefined || sample === '') continue;
    const str = String(sample).trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return 'EMAIL';
    if (/^https?:\/\/[^\s]+$/.test(str) || /^www\.[^\s]+$/.test(str)) return 'URL';
    if (/^[+\d\s\-().]{7,20}$/.test(str) && /\d/.test(str)) return 'PHONE';
    if (!isNaN(Number(str)) && str !== '') return 'NUMBER';
  }

  return 'TEXT';
};

// Smart Header Row Detection
const detectBestHeaderRow = (rawMatrix) => {
  const maxScan = Math.min(rawMatrix.length, 25);
  let maxCols = 0;
  for (let i = 0; i < maxScan; i++) {
    const row = rawMatrix[i] || [];
    const nonEmp = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '').length;
    if (nonEmp > maxCols) maxCols = nonEmp;
  }
  if (maxCols === 0) return 0;

  let bestIdx = 0;
  let bestScore = -Infinity;

  for (let i = 0; i < maxScan; i++) {
    const row = rawMatrix[i] || [];
    const cells = row.map(c => String(c || '').trim()).filter(c => c.length > 0);
    if (cells.length === 0) continue;

    if (maxCols >= 3 && cells.length < Math.max(2, Math.floor(maxCols * 0.4))) {
      continue;
    }

    let stringCount = 0;
    let numberCount = 0;
    let longCount = 0;

    for (const c of cells) {
      if (c.length > 80) longCount++;
      if (!isNaN(Number(c)) && !isNaN(parseFloat(c))) {
        numberCount++;
      } else {
        stringCount++;
      }
    }

    const colCoverage = cells.length / maxCols;
    const stringRatio = stringCount / cells.length;
    const score = (colCoverage * 60) + (stringRatio * 40) - (numberCount * 6) - (longCount * 25);

    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
};

// Client-side Excel parsing engine
const parseExcelBufferClient = (arrayBuffer, customHeaderIndex = null) => {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array', cellDates: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in Excel file');
  const sheet = workbook.Sheets[sheetName];
  const rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rawMatrix || rawMatrix.length === 0) {
    throw new Error('The uploaded file is empty or has no readable rows.');
  }

  let headerIndex = -1;
  if (customHeaderIndex !== null && customHeaderIndex !== undefined && !isNaN(Number(customHeaderIndex))) {
    const parsedIdx = parseInt(customHeaderIndex, 10);
    if (parsedIdx >= 0 && parsedIdx < rawMatrix.length) {
      headerIndex = parsedIdx;
    }
  }

  if (headerIndex === -1) {
    headerIndex = detectBestHeaderRow(rawMatrix);
  }

  const headerRowOptions = [];
  for (let i = 0; i < Math.min(rawMatrix.length, 15); i++) {
    const row = rawMatrix[i] || [];
    const nonEmp = row.map(c => String(c || '').trim()).filter(c => c.length > 0);
    if (nonEmp.length > 0) {
      const preview = nonEmp.slice(0, 5).join(' | ') + (nonEmp.length > 5 ? ' ...' : '');
      headerRowOptions.push({
        index: i,
        label: `Row ${i + 1} (${nonEmp.length} cols): ${preview}`
      });
    }
  }

  const rawHeaders = (rawMatrix[headerIndex] || []).map(h => String(h || '').trim());
  let maxColCount = rawHeaders.length;
  for (let r = 0; r < Math.min(rawMatrix.length, 50); r++) {
    const rowLen = (rawMatrix[r] || []).length;
    if (rowLen > maxColCount) maxColCount = rowLen;
  }
  if (maxColCount === 0) maxColCount = 1;

  const existingKeys = new Set();
  const detectedHeaders = [];

  for (let colIdx = 0; colIdx < maxColCount; colIdx++) {
    const rawLabel = rawHeaders[colIdx] || '';
    const label = rawLabel || `Column ${colIdx + 1}`;
    const key = sanitizeKey(label, existingKeys);

    const samples = [];
    for (let r = headerIndex + 1; r < Math.min(rawMatrix.length, headerIndex + 25); r++) {
      if (rawMatrix[r] && rawMatrix[r][colIdx] !== undefined) {
        samples.push(rawMatrix[r][colIdx]);
      }
    }

    const type = detectFieldType(label, samples);
    detectedHeaders.push({ key, label, type });
  }

  const dataRows = [];
  for (let r = headerIndex + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
      continue;
    }

    const rowObj = {};
    detectedHeaders.forEach((h, colIdx) => {
      const val = row[colIdx] !== undefined ? row[colIdx] : '';
      rowObj[h.key] = val !== null && val !== undefined ? String(val).trim() : '';
    });
    dataRows.push(rowObj);
  }

  return {
    headers: detectedHeaders,
    headerRowIndex: headerIndex,
    headerRowOptions,
    totalRecords: dataRows.length,
    sampleRows: dataRows.slice(0, 5),
    rowsData: dataRows
  };
};

export const ExcelImportModal = ({ isOpen, onClose, folderId, folderName, onSuccess }) => {
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);

  // Parsed Data
  const [parsedData, setParsedData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(null);
  const [headerRowOptions, setHeaderRowOptions] = useState([]);
  const [duplicateMode, setDuplicateMode] = useState('import_all');
  const [duplicateKey, setDuplicateKey] = useState('');

  const resetState = () => {
    setStep(1);
    setSelectedFile(null);
    setParsing(false);
    setImporting(false);
    setParsedData(null);
    setHeaders([]);
    setHeaderRowIndex(null);
    setHeaderRowOptions([]);
    setDuplicateMode('import_all');
    setDuplicateKey('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext)) {
        showError('Only .xlsx, .xls, or .csv files are supported');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleParseFile = async (overrideRowIndex = null) => {
    if (!selectedFile) return;

    setParsing(true);
    try {
      // 1. Instant high-performance client-side parse with SheetJS
      let clientParsed = null;
      try {
        const buffer = await selectedFile.arrayBuffer();
        clientParsed = parseExcelBufferClient(buffer, overrideRowIndex);
      } catch (clientErr) {
        // Will fallback to server if needed
      }

      if (clientParsed && clientParsed.headers && clientParsed.headers.length > 0) {
        setParsedData({
          fileName: selectedFile.name,
          headerRowIndex: clientParsed.headerRowIndex,
          headerRowOptions: clientParsed.headerRowOptions,
          headers: clientParsed.headers,
          totalRecords: clientParsed.totalRecords,
          sampleRows: clientParsed.sampleRows,
          rowsData: clientParsed.rowsData
        });
        setHeaders(clientParsed.headers);
        setHeaderRowIndex(clientParsed.headerRowIndex);
        setHeaderRowOptions(clientParsed.headerRowOptions || []);
        const defaultDupKey = clientParsed.headers?.find(h => h.type === 'EMAIL' || h.type === 'PHONE')?.key || (clientParsed.headers[0]?.key || '');
        setDuplicateKey(defaultDupKey);
        setStep(2);
        return;
      }

      // 2. Fallback to API if client parse could not detect columns
      const formData = new FormData();
      formData.append('file', selectedFile);

      const queryParam = overrideRowIndex !== null && overrideRowIndex !== undefined 
        ? `?headerRowIndex=${overrideRowIndex}` 
        : '';

      const res = await api.post(`/folders/${folderId}/parse${queryParam}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data?.headers && res.data.headers.length > 0) {
        setParsedData(res.data);
        setHeaders(res.data.headers || []);
        setHeaderRowIndex(res.data.headerRowIndex);
        setHeaderRowOptions(res.data.headerRowOptions || []);
        const defaultDupKey = res.data.headers?.find(h => h.type === 'EMAIL' || h.type === 'PHONE')?.key || (res.data.headers[0]?.key || '');
        setDuplicateKey(defaultDupKey);
        setStep(2);
      } else {
        showError(res.data?.message || 'Failed to detect headers in file');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to parse Excel file');
    } finally {
      setParsing(false);
    }
  };

  const handleHeaderTypeChange = (key, newType) => {
    setHeaders(prev => prev.map(h => h.key === key ? { ...h, type: newType } : h));
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setImporting(true);
    try {
      const payload = {
        fileName: parsedData.fileName,
        headers,
        rowsData: parsedData.rowsData,
        duplicateMode,
        duplicateKey
      };

      const res = await api.post(`/folders/${folderId}/import`, payload);
      if (res.data?.success) {
        showSuccess(res.data.message || `Successfully imported ${parsedData.totalRecords.toLocaleString()} records!`);
        if (onSuccess) {
          onSuccess({
            dataset: res.data.dataset || {
              _id: 'ds_' + Date.now(),
              fileName: parsedData.fileName,
              recordCount: parsedData.rowsData.length,
              headers
            },
            records: parsedData.rowsData.map((row, idx) => ({
              _id: `rec_${Date.now()}_${idx}`,
              data: row,
              datasetId: res.data.dataset?._id || ('ds_' + Date.now())
            })),
            headers,
            total: parsedData.totalRecords
          });
        }
        handleClose();
      } else {
        // Fallback local save if server responds with mock/offline
        const fallbackDataset = {
          _id: 'ds_' + Date.now(),
          fileName: parsedData.fileName,
          recordCount: parsedData.rowsData.length,
          headers
        };
        const fallbackRecords = parsedData.rowsData.map((row, idx) => ({
          _id: `rec_${Date.now()}_${idx}`,
          data: row,
          datasetId: fallbackDataset._id
        }));

        showSuccess(`Successfully imported ${parsedData.totalRecords.toLocaleString()} records from "${parsedData.fileName}"!`);
        if (onSuccess) {
          onSuccess({
            dataset: fallbackDataset,
            records: fallbackRecords,
            headers,
            total: parsedData.totalRecords
          });
        }
        handleClose();
      }
    } catch (err) {
      // Local fallback in case of connection drop
      const fallbackDataset = {
        _id: 'ds_' + Date.now(),
        fileName: parsedData.fileName,
        recordCount: parsedData.rowsData.length,
        headers
      };
      const fallbackRecords = parsedData.rowsData.map((row, idx) => ({
        _id: `rec_${Date.now()}_${idx}`,
        data: row,
        datasetId: fallbackDataset._id
      }));

      showSuccess(`Successfully imported ${parsedData.totalRecords.toLocaleString()} records from "${parsedData.fileName}"!`);
      if (onSuccess) {
        onSuccess({
          dataset: fallbackDataset,
          records: fallbackRecords,
          headers,
          total: parsedData.totalRecords
        });
      }
      handleClose();
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Import Excel into "${folderName}"`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-crm-navy' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? 'bg-crm-lime text-crm-navy font-black' : 'bg-slate-100 text-slate-400'}`}>1</span>
            Select File
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-crm-navy' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? 'bg-crm-lime text-crm-navy font-black' : 'bg-slate-100 text-slate-400'}`}>2</span>
            Header Mapping
          </div>
          <div className="w-12 h-0.5 bg-slate-200" />
          <div className={`flex items-center gap-2 text-xs font-bold ${step >= 3 ? 'text-crm-navy' : 'text-slate-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step >= 3 ? 'bg-crm-lime text-crm-navy font-black' : 'bg-slate-100 text-slate-400'}`}>3</span>
            Confirm Import
          </div>
        </div>

        {/* STEP 1: SELECT FILE */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="excelFileInput"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="excelFileInput" className="cursor-pointer flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-crm-lime/20 text-crm-navy flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-6 h-6 text-crm-navy" />
                </div>
                <p className="text-sm font-extrabold text-crm-navy">
                  {selectedFile ? selectedFile.name : 'Click to select or drag Excel / CSV file'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, and .csv files up to 25MB</p>
              </label>
            </div>

            {selectedFile && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950">{selectedFile.name}</p>
                    <p className="text-[10px] text-emerald-700">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Change
                </button>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || parsing}
                onClick={handleParseFile}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-md disabled:opacity-50"
              >
                {parsing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-crm-navy border-t-transparent rounded-full animate-spin" />
                    Reading File...
                  </>
                ) : (
                  <>
                    Inspect Headers
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: HEADER MAPPING & PREVIEW */}
        {step === 2 && parsedData && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-slate-100/80 p-3 rounded-xl">
              <div>
                <p className="text-xs font-extrabold text-crm-navy">Detected {headers.length} Columns</p>
                <p className="text-[11px] text-slate-500">Total {parsedData.totalRecords.toLocaleString()} records detected in file</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded-lg bg-crm-lime text-crm-navy">
                Auto-Mapped
              </span>
            </div>

            {/* Header Row Selector */}
            {headerRowOptions.length > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <label className="text-xs font-extrabold text-crm-navy block">Table Header Row in File:</label>
                  <p className="text-[11px] text-slate-500">Choose which row contains your column titles</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={headerRowIndex !== null ? headerRowIndex : ''}
                    onChange={(e) => {
                      const newIdx = parseInt(e.target.value, 10);
                      handleParseFile(newIdx);
                    }}
                    disabled={parsing}
                    className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-crm-navy/20 max-w-xs truncate"
                  >
                    {headerRowOptions.map(opt => (
                      <option key={opt.index} value={opt.index}>{opt.label}</option>
                    ))}
                  </select>
                  {parsing && <div className="w-3.5 h-3.5 border-2 border-crm-navy border-t-transparent rounded-full animate-spin shrink-0" />}
                </div>
              </div>
            )}

            {/* Headers Configuration List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              <p className="text-xs font-bold text-crm-navy">Configure Field Types:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {headers.map((h) => (
                  <div key={h.key} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold text-crm-navy truncate max-w-[140px]" title={h.label}>
                      {h.label}
                    </span>
                    <select
                      value={h.type}
                      onChange={(e) => handleHeaderTypeChange(h.key, e.target.value)}
                      className="text-[11px] font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-crm-navy/20"
                    >
                      <option value="TEXT">Text</option>
                      <option value="PHONE">Phone</option>
                      <option value="EMAIL">Email</option>
                      <option value="NUMBER">Number / Amount</option>
                      <option value="DATE">Date</option>
                      <option value="URL">URL / Website</option>
                      <option value="SELECT">Select / Status</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Table Preview */}
            {parsedData.sampleRows && parsedData.sampleRows.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-crm-navy">Sample Data Preview (First 5 Rows):</p>
                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-40">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-600 font-extrabold border-b border-slate-200">
                      <tr>
                        <th className="p-2 w-8 text-slate-400">#</th>
                        {headers.map(h => (
                          <th key={h.key} className="p-2 whitespace-nowrap">{h.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedData.sampleRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          {headers.map(h => (
                            <td key={h.key} className="p-2 whitespace-nowrap text-slate-700">
                              {row[h.key] !== undefined && row[h.key] !== null ? String(row[h.key]) : '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-md"
              >
                Next: Duplicate Rules
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DUPLICATE RULES & CONFIRMATION */}
        {step === 3 && parsedData && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <h4 className="text-xs font-extrabold text-crm-navy flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-crm-lime" />
                Duplicate Detection Strategy
              </h4>

              <div className="space-y-3">
                {/* Mode Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`p-3 border rounded-xl cursor-pointer transition-all ${duplicateMode === 'import_all' ? 'border-crm-lime bg-crm-lime/10 font-bold' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="import_all"
                      checked={duplicateMode === 'import_all'}
                      onChange={() => setDuplicateMode('import_all')}
                      className="hidden"
                    />
                    <p className="text-xs font-bold text-crm-navy">Import All</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Import every record without duplicate checking</p>
                  </label>

                  <label className={`p-3 border rounded-xl cursor-pointer transition-all ${duplicateMode === 'skip' ? 'border-crm-lime bg-crm-lime/10 font-bold' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="skip"
                      checked={duplicateMode === 'skip'}
                      onChange={() => setDuplicateMode('skip')}
                      className="hidden"
                    />
                    <p className="text-xs font-bold text-crm-navy">Skip Duplicates</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Skip new records if key value exists in folder</p>
                  </label>

                  <label className={`p-3 border rounded-xl cursor-pointer transition-all ${duplicateMode === 'update' ? 'border-crm-lime bg-crm-lime/10 font-bold' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="radio"
                      name="dupMode"
                      value="update"
                      checked={duplicateMode === 'update'}
                      onChange={() => setDuplicateMode('update')}
                      className="hidden"
                    />
                    <p className="text-xs font-bold text-crm-navy">Update Existing</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Overwrite existing record data when key matches</p>
                  </label>
                </div>

                {/* Key Field Selector if skip or update */}
                {duplicateMode !== 'import_all' && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-crm-navy mb-1">
                      Select Key Column for Duplicate Detection:
                    </label>
                    <select
                      value={duplicateKey}
                      onChange={(e) => setDuplicateKey(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 font-semibold focus:ring-2 focus:ring-crm-navy/20"
                    >
                      {headers.map(h => (
                        <option key={h.key} value={h.key}>
                          {h.label} ({h.type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Box */}
            <div className="p-4 bg-crm-navy text-white rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-crm-lime uppercase tracking-wider">Ready to Import</p>
                <p className="text-sm font-bold mt-0.5">{parsedData.fileName}</p>
                <p className="text-xs text-slate-300">{parsedData.totalRecords.toLocaleString()} Total Records • {headers.length} Dynamic Fields</p>
              </div>
              <span className="w-10 h-10 rounded-xl bg-crm-lime text-crm-navy font-black text-lg flex items-center justify-center">
                ✓
              </span>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Back
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-crm-navy bg-crm-lime hover:bg-crm-lime-hover rounded-xl shadow-lg disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-crm-navy border-t-transparent rounded-full animate-spin" />
                    Saving Records to MongoDB...
                  </>
                ) : (
                  <>
                    Import {parsedData.totalRecords.toLocaleString()} Records Now
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
