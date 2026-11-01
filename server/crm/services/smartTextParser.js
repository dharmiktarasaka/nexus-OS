/**
 * Smart Random Text Parser Service
 * Supports 2 Ingestion Modes:
 * 1. Smart Auto Detect (Heuristic Parser)
 * 2. Numbered Rows (User-Controlled Row Numbering Parser)
 */

// Regex patterns for Stage 1 (Deterministic Extraction)
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/i;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/;
const WEBSITE_REGEX = /\b(?:https?:\/\/|www\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/[^\s,;]*)?\b/i;
const RATING_REGEX = /\b([0-5]\.\d)\s*[\(\[\{]?\s*(\d+)?[\)\]\}]?\b/;

// Row Marker at Line Start Regex: e.g. "1 ABC", "1. ABC", "1) ABC", "1 - ABC", "100 ABC"
const ROW_MARKER_REGEX = /^\s*(\d+)[\.\)\s\-:\t]+/;
const ALT_ROW_MARKER_REGEX = /^\s*(\d+)\b/;

// Keywords for Stage 2 (Intelligent Classification)
const COMPANY_SUFFIXES = [
  'pvt ltd', 'ltd', 'inc', 'corp', 'corporation', 'industries', 'manufacturing',
  'services', 'tech', 'technologies', 'solutions', 'agency', 'studio', 'firm',
  'co', 'company', 'enterprises', 'group', 'traders', 'cenvar', 'works'
];

const STATUS_KEYWORDS = {
  LOST: ['not interested', 'disqualified', 'rejected', 'no interest', 'not required', 'closed lost', 'number busy', 'busy', 'wrong number', 'switched off', 'no response'],
  WON: ['converted', 'won', 'closed won', 'deal closed', 'client onboarded'],
  INTERESTED: ['interested', 'hot lead', 'warm lead', 'looking for service', 'demanded quote'],
  QUALIFIED: ['qualified', 'budget approved', 'decision maker confirmed'],
  MEETING: ['meeting scheduled', 'demo done', 'meeting', 'discussion scheduled'],
  PROPOSAL_SENT: ['proposal sent', 'quote sent', 'pricing shared'],
  CONTACTED: ['contacted', 'called', 'spoken', 'whatsapp sent', 'email sent', 'connected'],
  NEW: ['new', 'pending', 'fresh', 'uncontacted']
};

const ACTIVITY_PATTERNS = [
  'email done', 'email sent', 'emails done', 'called', 'whatsapp sent', 'call back',
  'followup', 'follow up', 'message sent', 'demo done', 'meeting done', 'number busy'
];

const clean = (str) => (str || '').trim();

/**
 * Check if a string contains any deterministic entity
 */
const isDeterministicEntity = (text) => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return (
    EMAIL_REGEX.test(text) ||
    (PHONE_REGEX.test(text) && !text.includes('http') && !text.includes('@')) ||
    WEBSITE_REGEX.test(text) ||
    RATING_REGEX.test(text) ||
    ACTIVITY_PATTERNS.some(act => lower.includes(act)) ||
    Object.values(STATUS_KEYWORDS).some(list => list.some(kw => lower.includes(kw)))
  );
};

/**
 * Parse a single lead text chunk into structured Lead Candidate object
 */
const parseSingleChunk = (chunk, importRowNumber = null) => {
  let rawTokens = [];
  const linesInChunk = chunk.split(/\r?\n/);

  linesInChunk.forEach(line => {
    if (line.includes('|')) {
      rawTokens.push(...line.split('|'));
    } else if (line.includes(';') && !line.includes('http')) {
      rawTokens.push(...line.split(';'));
    } else if (line.includes('\t')) {
      rawTokens.push(...line.split('\t'));
    } else if (line.includes(',') && !RATING_REGEX.test(line)) {
      rawTokens.push(...line.split(','));
    } else {
      rawTokens.push(line);
    }
  });

  const tokens = rawTokens.map(t => clean(t)).filter(Boolean);

  const leadRecord = {
    name: '',
    companyName: '',
    decisionMaker: '',
    phone: '',
    email: '',
    websiteUrl: '',
    googleReview: '',
    rating: 0,
    reviewCount: 0,
    industry: '',
    location: '',
    service: '',
    status: 'NEW',
    emailStatus: '',
    nextAction: '',
    lostReason: '',
    notes: '',
    rawSnippet: chunk,
    confidence: 90,
    importRowNumber: importRowNumber,
    customFields: {}
  };

  const residualNotes = [];

  tokens.forEach((token) => {
    const lowerToken = token.toLowerCase();

    // Check 1: Email
    if (!leadRecord.email && EMAIL_REGEX.test(token)) {
      const match = token.match(EMAIL_REGEX);
      if (match) leadRecord.email = match[0].toLowerCase();
      return;
    }

    // Check 2: Phone
    if (!leadRecord.phone && PHONE_REGEX.test(token) && !token.includes('http') && !token.includes('@')) {
      const match = token.match(PHONE_REGEX);
      if (match && match[0].replace(/\D/g, '').length >= 7) {
        leadRecord.phone = match[0];
        return;
      }
    }

    // Check 3: Website URL
    if (!leadRecord.websiteUrl && WEBSITE_REGEX.test(token)) {
      const match = token.match(WEBSITE_REGEX);
      if (match) {
        leadRecord.websiteUrl = match[0];
        return;
      }
    }

    // Check 4: Rating & Review Count (e.g. 4.9(90) or 4.7 (120))
    if (!leadRecord.googleReview && RATING_REGEX.test(token)) {
      const ratingMatch = token.match(RATING_REGEX);
      if (ratingMatch) {
        leadRecord.rating = parseFloat(ratingMatch[1]) || 0;
        leadRecord.reviewCount = parseInt(ratingMatch[2] || '0', 10) || 0;
        leadRecord.googleReview = `${ratingMatch[1]}${ratingMatch[2] ? ` (${ratingMatch[2]})` : ''}`;
        return;
      }
    }

    // Check 5: Status / Stage & Lost Reason
    let statusFound = false;
    for (const [st, keywords] of Object.entries(STATUS_KEYWORDS)) {
      if (keywords.some(kw => lowerToken.includes(kw))) {
        leadRecord.status = st;
        if (st === 'LOST') {
          leadRecord.lostReason = token;
        }
        statusFound = true;
        break;
      }
    }

    // Check 6: Activity / Next Action / Email Status
    if (ACTIVITY_PATTERNS.some(act => lowerToken.includes(act))) {
      if (lowerToken.includes('email')) {
        leadRecord.emailStatus = token;
      }
      if (!leadRecord.nextAction) {
        leadRecord.nextAction = token;
      }
      residualNotes.push(token);
      return;
    }

    if (statusFound) return;

    // Check 7: Company Name
    if (!leadRecord.companyName && COMPANY_SUFFIXES.some(sfx => lowerToken.includes(sfx))) {
      leadRecord.companyName = token;
      return;
    }

    // Check 8: Name / Decision Maker
    if (!leadRecord.name && !leadRecord.decisionMaker && token.length <= 50 && !/\d{5,}/.test(token)) {
      leadRecord.name = token;
      leadRecord.decisionMaker = token;
      return;
    }

    // Check 9: Secondary Company Name fallback
    if (leadRecord.name && !leadRecord.companyName && token.length <= 50) {
      leadRecord.companyName = token;
      return;
    }

    // Check 10: Residual Notes (Zero Data Loss guarantee)
    residualNotes.push(token);
  });

  // Fallbacks
  if (!leadRecord.companyName && leadRecord.name) {
    leadRecord.companyName = leadRecord.name;
  }
  if (!leadRecord.name) {
    leadRecord.name = leadRecord.companyName || leadRecord.decisionMaker || (importRowNumber ? `Row ${importRowNumber} Lead` : 'Lead Record');
  }
  if (residualNotes.length > 0) {
    const uniqueNotes = Array.from(new Set(residualNotes));
    leadRecord.notes = uniqueNotes.join(' | ');
  }

  return leadRecord;
};

/**
 * Mode 1: Smart Auto Detect Mode
 */
const parseRandomText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return { parsedLeads: [], warnings: [] };

  const blockSplit = rawText.split(/\r?\n\s*\r?\n/).map(c => c.trim()).filter(Boolean);
  let chunks = [];
  if (blockSplit.length > 1 && blockSplit.some(b => b.includes('\n'))) {
    chunks = blockSplit;
  } else {
    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let currentGroup = [];
    let currentGroupHasEntity = false;

    lines.forEach((line) => {
      const isEntity = isDeterministicEntity(line);
      const lowerLine = line.toLowerCase();
      const isCompanyHeader = COMPANY_SUFFIXES.some(sfx => lowerLine.includes(sfx));

      const shouldStartNewGroup =
        currentGroup.length > 0 &&
        (isCompanyHeader || (!isEntity && currentGroupHasEntity));

      if (shouldStartNewGroup) {
        chunks.push(currentGroup.join('\n'));
        currentGroup = [line];
        currentGroupHasEntity = isEntity;
      } else {
        currentGroup.push(line);
        if (isEntity) currentGroupHasEntity = true;
      }
    });

    if (currentGroup.length > 0) {
      chunks.push(currentGroup.join('\n'));
    }
  }

  const results = chunks.map((chunk, idx) => parseSingleChunk(chunk, idx + 1));

  return {
    parsedLeads: results,
    warnings: []
  };
};

/**
 * Mode 2: Numbered Rows Mode
 * Uses explicit row numbers at line starts (1 ABC, 2. XYZ, 3) PQR) to anchor row boundaries
 */
const parseNumberedRowsText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return { parsedLeads: [], warnings: [] };

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rowGroups = [];
  const warnings = [];

  let currentNum = null;
  let currentLines = [];
  let rowNumbersSeen = [];
  let missingNumbersSeen = false;

  lines.forEach((line) => {
    // Check if line starts with a number marker (1, 1., 1), 1 -)
    const markerMatch = line.match(ROW_MARKER_REGEX) || line.match(ALT_ROW_MARKER_REGEX);

    if (markerMatch) {
      const numVal = parseInt(markerMatch[1], 10);
      const strippedLine = clean(line.replace(/^\s*\d+[\.\)\s\-:\t]*/, ''));

      // If previous row exists, finalize it
      if (currentNum !== null && currentLines.length > 0) {
        rowGroups.push({ rowNumber: currentNum, text: currentLines.join('\n') });
      }

      currentNum = numVal;
      rowNumbersSeen.push(numVal);
      currentLines = strippedLine ? [strippedLine] : [];
    } else {
      if (currentNum !== null) {
        currentLines.push(line);
      } else {
        missingNumbersSeen = true;
      }
    }
  });

  if (currentNum !== null && currentLines.length > 0) {
    rowGroups.push({ rowNumber: currentNum, text: currentLines.join('\n') });
  }

  // Warning Checks
  if (missingNumbersSeen && rowGroups.length === 0) {
    warnings.push({
      type: 'MISSING_ROW_NUMBERS',
      message: 'Every lead must start with a row number (e.g. 1 ABC, 2 XYZ).'
    });
  }

  // Check duplicate row numbers
  const seenMap = {};
  const duplicates = [];
  rowNumbersSeen.forEach(n => {
    if (seenMap[n]) duplicates.push(n);
    else seenMap[n] = true;
  });

  if (duplicates.length > 0) {
    warnings.push({
      type: 'DUPLICATE_ROW_NUMBERS',
      message: `Duplicate row number detected: Row ${Array.from(new Set(duplicates)).join(', ')}`
    });
  }

  // Check non-sequential gaps
  if (rowGroups.length > 1) {
    const sortedNums = [...rowNumbersSeen].sort((a, b) => a - b);
    const missing = [];
    for (let i = sortedNums[0]; i <= sortedNums[sortedNums.length - 1]; i++) {
      if (!seenMap[i]) missing.push(i);
    }
    if (missing.length > 0 && missing.length <= 15) {
      warnings.push({
        type: 'NON_SEQUENTIAL',
        message: `Row numbers are not sequential. Missing rows: ${missing.join(', ')}`
      });
    }
  }

  // Parse each row group into lead candidate
  const results = rowGroups.map(rg => parseSingleChunk(rg.text, rg.rowNumber));

  return {
    parsedLeads: results,
    warnings
  };
};

module.exports = {
  parseRandomText,
  parseNumberedRowsText
};
