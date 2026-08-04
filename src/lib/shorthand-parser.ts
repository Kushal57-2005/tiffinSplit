export interface ParsedItem {
  shortCode: string;
  quantity: number;
  rawToken: string;
}

export interface ParsedMealNote {
  rawText: string;
  suggestedDate?: string; // YYYY-MM-DD
  suggestedMealType?: "MORNING" | "NIGHT";
  items: ParsedItem[];
  unmatchedTokens: string[];
}

export function parseShorthandNote(note: string, activeShortCodes: string[]): ParsedMealNote {
  const result: ParsedMealNote = {
    rawText: note,
    items: [],
    unmatchedTokens: [],
  };

  if (!note || !note.trim()) return result;

  let text = note.trim();

  // Extract meal type
  if (/\b(m|morning|am)\b/i.test(text)) {
    result.suggestedMealType = "MORNING";
  } else if (/\b(n|night|pm)\b/i.test(text)) {
    result.suggestedMealType = "NIGHT";
  }

  // Extract date if present (e.g. "29 July", "30 July", "29/07", "2026-07-29")
  const dateMatch = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\b/i);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const monthName = dateMatch[2].toLowerCase();
    const months: Record<string, number> = {
      jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
      apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
      aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
      nov: 10, november: 10, dec: 11, december: 11,
    };
    if (months[monthName] !== undefined) {
      const year = new Date().getFullYear();
      const month = months[monthName];
      const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
      result.suggestedDate = d.toISOString().split("T")[0];
    }
  }

  // Known code aliases
  const codeAliases: Record<string, string> = {
    H: "SH",
  };

  // Split items part after "-" if present, or parse entire text
  let itemsPart = text;
  if (text.includes("-")) {
    itemsPart = text.split("-")[1];
  }

  // Split by comma, space, or semicolon
  const tokens = itemsPart.split(/[,;\s]+/).map(t => t.trim()).filter(Boolean);

  const upperCodes = new Set(activeShortCodes.map(c => c.toUpperCase()));

  for (const token of tokens) {
    const cleanToken = token.toUpperCase();
    
    // Ignore date/meal keywords if they ended up in tokens
    if (["MORNING", "NIGHT", "JULY", "AUGUST", "AM", "PM", "M", "N"].includes(cleanToken)) {
      continue;
    }

    // Match pattern like "2K", "2-K", "3KP", "K", "H"
    const match = cleanToken.match(/^(\d+)?-?([A-Z0-9]+)$/);
    if (match) {
      const qtyStr = match[1];
      let code = match[2];
      const quantity = qtyStr ? parseInt(qtyStr, 10) : 1;

      // Apply alias lookup if applicable
      if (codeAliases[code]) {
        code = codeAliases[code];
      }

      if (upperCodes.has(code)) {
        // If code already parsed, combine quantity
        const existing = result.items.find(i => i.shortCode === code);
        if (existing) {
          existing.quantity += quantity;
        } else {
          result.items.push({
            shortCode: code,
            quantity,
            rawToken: token,
          });
        }
      } else {
        result.unmatchedTokens.push(token);
      }
    } else {
      result.unmatchedTokens.push(token);
    }
  }

  return result;
}

export function parseMultiLineShorthand(multiLineText: string, activeShortCodes: string[]): ParsedMealNote[] {
  if (!multiLineText || !multiLineText.trim()) return [];

  const lines = multiLineText.split("\n").map(l => l.trim()).filter(Boolean);
  return lines.map(line => parseShorthandNote(line, activeShortCodes));
}
