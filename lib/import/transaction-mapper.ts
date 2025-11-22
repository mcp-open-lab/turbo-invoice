import { parse, isValid } from "date-fns";

export interface NormalizedTransaction {
  date: Date | null;
  description: string;
  amount: number;
  merchantName?: string;
  category?: string;
  raw: Record<string, any>;
}

// Common column name variations
const COL_MAPPINGS = {
  date: [
    "date",
    "txn date",
    "transaction date",
    "posted date",
    "effective date",
  ],
  description: [
    "description",
    "desc",
    "memo",
    "payee",
    "merchant",
    "narrative",
    "details",
    "transaction",
  ],
  amount: ["amount", "amt", "value", "net"],
  debit: ["debit", "dr", "withdrawal", "money out"],
  credit: ["credit", "cr", "deposit", "money in"],
  balance: ["balance", "bal", "running balance"],
  category: ["category", "type", "class"],
};

/**
 * Normalize a raw spreadsheet row into a standard transaction format
 */
export function mapRowToTransaction(
  row: Record<string, any>
): NormalizedTransaction | null {
  const keys = Object.keys(row).map((k) => k.toLowerCase().trim());
  const normalized: NormalizedTransaction = {
    date: null,
    description: "",
    amount: 0,
    raw: row,
  };

  // Helper to find a value by checking multiple possible column names
  const findValue = (mappings: string[]): any => {
    const foundKey = keys.find((key) => mappings.some((m) => key.includes(m)));
    if (!foundKey) return undefined;
    // Return the value from the original row using the original case-sensitive key
    const originalKey = Object.keys(row).find(
      (k) => k.toLowerCase().trim() === foundKey
    );
    return originalKey ? row[originalKey] : undefined;
  };

  // 1. Parse Date
  const rawDate = findValue(COL_MAPPINGS.date);
  if (rawDate) {
    if (rawDate instanceof Date && isValid(rawDate)) {
      normalized.date = rawDate;
    } else if (typeof rawDate === "string" || typeof rawDate === "number") {
      // Try to parse common formats if SheetJS didn't already
      // Excel dates as numbers (serial) are handled by SheetJS cellDates: true
      const parsed = new Date(rawDate);
      if (isValid(parsed)) {
        normalized.date = parsed;
      }
    }
  }

  // 2. Parse Description
  const rawDesc = findValue(COL_MAPPINGS.description);
  if (rawDesc) {
    normalized.description = String(rawDesc).trim();
  }

  // 3. Parse Amount
  // Complication: Some sheets have one "Amount" column (signed or unsigned), others have "Debit" and "Credit" columns
  const debit = findValue(COL_MAPPINGS.debit);
  const credit = findValue(COL_MAPPINGS.credit);
  const amount = findValue(COL_MAPPINGS.amount);

  if (debit !== undefined || credit !== undefined) {
    // Dual column format
    const debitVal = parseAmount(debit) || 0;
    const creditVal = parseAmount(credit) || 0;
    // Debits are negative, credits are positive
    // Note: Some statements show debits as positive numbers in a "Debit" column. We treat them as negative flow.
    normalized.amount = creditVal - Math.abs(debitVal);
  } else if (amount !== undefined) {
    // Single column format
    normalized.amount = parseAmount(amount) || 0;
  }

  // 4. Parse Category (optional)
  const category = findValue(COL_MAPPINGS.category);
  if (category) {
    normalized.category = String(category).trim();
  }

  // Validation: Must have at least a description or amount to be useful?
  // Actually, date is pretty critical too.
  if (!normalized.date && !normalized.description && normalized.amount === 0) {
    return null;
  }

  return normalized;
}

/**
 * Parse string or number amounts
 * Handles "$1,234.56", "(100.00)", "-100"
 */
function parseAmount(val: any): number | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return val;

  const str = String(val).trim();
  if (!str) return undefined;

  // Handle accounting format: (100) = -100
  const isNegativeParen = str.startsWith("(") && str.endsWith(")");

  // Remove currency symbols, commas, and parentheses
  const cleanStr = str.replace(/[$,()]/g, "");

  const num = parseFloat(cleanStr);
  if (isNaN(num)) return undefined;

  return isNegativeParen ? -num : num;
}
