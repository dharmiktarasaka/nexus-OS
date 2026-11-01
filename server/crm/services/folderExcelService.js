const xlsx = require('xlsx');

// Helper to sanitize key string for MongoDB object properties
const sanitizeKey = (label, existingKeys) => {
  let key = label
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

// Smart Field Type Detection based on sample values
const detectFieldType = (label, samples) => {
  const lowerLabel = label.toLowerCase();
  
  if (lowerLabel.includes('email') || lowerLabel.includes('mail')) return 'EMAIL';
  if (lowerLabel.includes('phone') || lowerLabel.includes('mobile') || lowerLabel.includes('contact') || lowerLabel.includes('cell')) return 'PHONE';
  if (lowerLabel.includes('date') || lowerLabel.includes('time') || lowerLabel.includes('dob')) return 'DATE';
  if (lowerLabel.includes('amount') || lowerLabel.includes('price') || lowerLabel.includes('budget') || lowerLabel.includes('cost') || lowerLabel.includes('salary')) return 'NUMBER';
  if (lowerLabel.includes('url') || lowerLabel.includes('website') || lowerLabel.includes('link')) return 'URL';
  if (lowerLabel.includes('status') || lowerLabel.includes('stage')) return 'SELECT';

  // Inspect sample row values
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

  // Find max columns populated across candidate rows
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

    // Reject banner/title rows that have far fewer columns than maxCols (e.g. 1 title cell when table has 5+ cols)
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

    // Score: reward column coverage & text labels, penalize numbers and long paragraphs
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

// Parse Excel or CSV buffer
const parseBuffer = (fileBuffer, customHeaderIndex = null) => {
  const workbook = xlsx.read(fileBuffer, { type: 'buffer', cellDates: true, raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to 2D array of rows
  const rawMatrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (!rawMatrix || rawMatrix.length === 0) {
    throw new Error('The uploaded file is empty or has no readable rows.');
  }

  // Determine header row index
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

  // Generate top rows options for user selection in frontend
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

    // Extract sample values from up to 25 rows below header
    const samples = [];
    for (let r = headerIndex + 1; r < Math.min(rawMatrix.length, headerIndex + 25); r++) {
      if (rawMatrix[r] && rawMatrix[r][colIdx] !== undefined) {
        samples.push(rawMatrix[r][colIdx]);
      }
    }

    const type = detectFieldType(label, samples);
    detectedHeaders.push({ key, label, type });
  }

  // Extract data rows
  const dataRows = [];
  for (let r = headerIndex + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
      continue; // Skip empty rows
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

// Generate Export File Buffer
const generateExportBuffer = (records, headers, format = 'xlsx') => {
  const exportHeaders = headers.map(h => h.label);
  const exportData = [exportHeaders];

  records.forEach(rec => {
    const dataObj = rec.data || rec;
    const row = headers.map(h => {
      const val = dataObj[h.key];
      return val !== undefined && val !== null ? val : '';
    });
    exportData.push(row);
  });

  const worksheet = xlsx.utils.aoa_to_sheet(exportData);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Exported Data');

  if (format === 'csv') {
    const csvString = xlsx.utils.sheet_to_csv(worksheet);
    return Buffer.from(csvString, 'utf-8');
  }

  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  parseBuffer,
  generateExportBuffer
};
