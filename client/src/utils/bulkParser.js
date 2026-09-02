export function parseBulkMealText(
  rawText,
  friendsList = [],
  defaultYear = new Date().getFullYear(),
  defaultRates = { morning: 40, night: 40 }
) {
  if (!rawText || !rawText.trim()) return [];

  // Map short codes (uppercase) and full names (lowercase) to friend objects
  const shortCodeMap = {};
  const fullNameMap = {};
  const availableCodes = [];

  friendsList.forEach((f) => {
    if (f.shortCode) {
      const sc = f.shortCode.trim().toUpperCase();
      shortCodeMap[sc] = f;
      availableCodes.push(sc);
    }
    if (f.fullName) {
      fullNameMap[f.fullName.trim().toLowerCase()] = f;
    }
  });

  const monthMap = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const monthNamesFull = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (monthIndex, yr) => {
    if (monthIndex === 1) {
      // February leap year check
      const isLeap = (yr % 4 === 0 && yr % 100 !== 0) || (yr % 400 === 0);
      return isLeap ? 29 : 28;
    }
    const daysArr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return daysArr[monthIndex];
  };

  const lines = rawText.split('\n');
  const parsed = [];

  lines.forEach((originalLine, lineIdx) => {
    const trimmed = originalLine.trim();
    if (!trimmed) return; // Skip empty lines

    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 2) {
      parsed.push({
        lineNum: lineIdx + 1,
        rawLine: trimmed,
        isValid: false,
        error: 'Line too short. Expected format e.g. "01 Aug m K S"'
      });
      return;
    }

    let day = null;
    let month = null;
    let year = defaultYear;
    let tokenIdx = 0;

    const t0 = tokens[0].toLowerCase();
    const t1 = tokens[1] ? tokens[1].toLowerCase() : '';

    // Format 1: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(t0)) {
      const parts = t0.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
      tokenIdx = 1;
    }
    // Format 2: DD/MM or DD/MM/YYYY
    else if (/^\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?$/.test(t0)) {
      const parts = t0.split(/[\/\-]/);
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      if (parts[2]) {
        year = parts[2].length === 2 ? 2000 + parseInt(parts[2], 10) : parseInt(parts[2], 10);
      }
      tokenIdx = 1;
    }
    // Format 3: "01 Aug" or "1st August"
    else if (/^\d{1,2}(st|nd|rd|th)?$/.test(t0) && monthMap[t1] !== undefined) {
      day = parseInt(t0.replace(/\D/g, ''), 10);
      month = monthMap[t1];
      tokenIdx = 2;
    }
    // Format 4: "Aug 01" or "August 1"
    else if (monthMap[t0] !== undefined && /^\d{1,2}$/.test(t1)) {
      month = monthMap[t0];
      day = parseInt(t1, 10);
      tokenIdx = 2;
    }

    // 1. DATE PARSING & VALIDATION
    if (day === null || month === null || isNaN(day) || isNaN(month)) {
      parsed.push({
        lineNum: lineIdx + 1,
        rawLine: trimmed,
        isValid: false,
        error: `Invalid date format "${tokens[0]} ${tokens[1] || ''}". Expected e.g. "01 Aug" or "01/08"`
      });
      return;
    }

    if (month < 0 || month > 11) {
      parsed.push({
        lineNum: lineIdx + 1,
        rawLine: trimmed,
        isValid: false,
        error: `Invalid month "${month + 1}". Month must be between 1 (Jan) and 12 (Dec).`
      });
      return;
    }

    const maxDays = getDaysInMonth(month, year);
    const mName = monthNamesFull[month];

    if (day < 1 || day > maxDays) {
      parsed.push({
        lineNum: lineIdx + 1,
        rawLine: trimmed,
        isValid: false,
        error: `Invalid date "${day} ${mName}" — ${mName} ${year} only has ${maxDays} days.`
      });
      return;
    }

    // Construct valid ISO date string
    const mmStr = String(month + 1).padStart(2, '0');
    const ddStr = String(day).padStart(2, '0');
    const entryDate = `${year}-${mmStr}-${ddStr}`;

    // 2. MEAL TYPE PARSING
    let mealType = 'MORNING';
    if (tokens[tokenIdx]) {
      const mToken = tokens[tokenIdx].toLowerCase();
      if (mToken === 'm' || mToken === 'morning') {
        mealType = 'MORNING';
        tokenIdx++;
      } else if (mToken === 'n' || mToken === 'night') {
        mealType = 'NIGHT';
        tokenIdx++;
      }
    }

    const price = mealType === 'NIGHT' ? (defaultRates.night || 40) : (defaultRates.morning || 40);

    // 3. FRIEND CODES & RANDOM TEXT VALIDATION
    const items = [];
    const unknownCodes = [];

    for (let i = tokenIdx; i < tokens.length; i++) {
      const tokRaw = tokens[i].trim();
      if (!tokRaw) continue;

      const tokUpper = tokRaw.toUpperCase();
      const tokLower = tokRaw.toLowerCase();

      // Check pattern e.g. 2KP or KP or 3K
      const match = tokUpper.match(/^(\d+)?([A-Z0-9_]+)$/);
      let qty = 1;
      let code = tokUpper;

      if (match) {
        qty = match[1] ? parseInt(match[1], 10) : 1;
        code = match[2];
      }

      // Try matching by short code
      let friend = shortCodeMap[code];

      // If not short code, try matching full name
      if (!friend) {
        friend = fullNameMap[tokLower];
      }

      if (friend) {
        items.push({
          friendId: friend.id,
          fullName: friend.fullName,
          shortCode: friend.shortCode,
          quantity: qty,
          unitPrice: price,
          lineTotal: qty * price
        });
      } else {
        unknownCodes.push(tokRaw);
      }
    }

    // Check errors for unrecognized codes / random text
    if (unknownCodes.length > 0) {
      const availList = availableCodes.length > 0 ? availableCodes.join(', ') : 'None registered';
      parsed.push({
        lineNum: lineIdx + 1,
        rawLine: trimmed,
        entryDate,
        mealType,
        isValid: false,
        error: `Unrecognized friend code(s) / text: ${unknownCodes.map((c) => `"${c}"`).join(', ')}. (Available codes: ${availList})`
      });
      return;
    }

    if (items.length === 0) {
      parsed.push({
        lineNum: lineIdx + 1,
        rawLine: trimmed,
        entryDate,
        mealType,
        isValid: false,
        error: `No friends specified for this meal.`
      });
      return;
    }

    parsed.push({
      lineNum: lineIdx + 1,
      rawLine: trimmed,
      entryDate,
      mealType,
      defaultPrice: price,
      items,
      unknownCodes: [],
      isValid: true
    });
  });

  return parsed;
}
