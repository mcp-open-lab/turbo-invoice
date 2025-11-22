import * as XLSX from "xlsx";
import type { MappingConfig } from "./ai-column-mapper";
import { convertInstructionsToConfig } from "./ai-column-mapper";
import { DataConverter } from "./field-converters";

export interface TransactionRow {
  date?: string | Date;
  description?: string;
  amount?: number | string;
  category?: string;
  balance?: number | string;
  reference?: string;
  [key: string]: any;
}

export interface ParseResult {
  success: boolean;
  rows: TransactionRow[];
  headers?: string[];
  error?: string;
  sheetName?: string;
}

export interface NormalizedTransaction {
  transactionDate?: Date | null;
  postedDate?: Date | null;
  description?: string;
  amount?: number | null;
  debit?: number | null;
  credit?: number | null;
  balance?: number | null;
  category?: string;
  merchantName?: string;
  referenceNumber?: string;
  raw: Record<string, any>;
}

/**
 * Parse a spreadsheet file (XLSX, XLS, CSV) buffer into JSON rows
 */
export function parseSpreadsheet(
  fileBuffer: ArrayBuffer | Buffer,
  fileName: string
): ParseResult {
  try {
    const workbook = XLSX.read(fileBuffer, {
      type: "buffer",
      cellDates: true, // Parse dates as JS Date objects
      cellNF: false, // Skip format strings (perf)
      cellText: false, // Skip generated text (perf)
    });

    // Use the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return { success: false, rows: [], error: "No sheets found in file" };
    }

    // Convert to JSON (array of arrays for raw processing)
    // header: 1 means "array of arrays"
    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    if (rawRows.length === 0) {
      return { success: true, rows: [], sheetName };
    }

    // 1. Find the header row
    // Heuristic: Look for common transaction headers in the first 10 rows
    // "Date", "Description", "Amount", "Debit", "Credit", "Balance"
    let headerRowIndex = -1;
    let headers: string[] = [];

    const commonHeaders = [
      "date",
      "time",
      "description",
      "payee",
      "merchant",
      "amount",
      "debit",
      "credit",
      "balance",
      "reference",
      "ref",
      "category",
    ];

    for (let i = 0; i < Math.min(rawRows.length, 20); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;

      const matchingColumns = row.filter((cell) => {
        if (typeof cell !== "string") return false;
        const normalized = cell.toLowerCase().trim();
        return commonHeaders.some((h) => normalized.includes(h));
      });

      // If we find at least 2 transaction-like columns, assume this is the header
      if (matchingColumns.length >= 2) {
        headerRowIndex = i;
        headers = row.map((c) => String(c).trim());
        break;
      }
    }

    // If no header found, assume first row is header if it has strings
    if (headerRowIndex === -1 && rawRows.length > 0) {
      headerRowIndex = 0;
      headers = rawRows[0].map((c) => String(c).trim());
    }

    // 2. Extract data rows
    const dataRows = rawRows.slice(headerRowIndex + 1);
    const parsedRows: TransactionRow[] = dataRows.map((row) => {
      const rowObj: TransactionRow = {};
      
      // Map row array to object using headers
      headers.forEach((header, index) => {
        if (index < row.length && header) {
          rowObj[header] = row[index];
        }
      });
      
      return rowObj;
    });

    return {
      success: true,
      rows: parsedRows,
      headers,
      sheetName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, rows: [], error: errorMessage };
  }
}

/**
 * Get a preview of the first rows of a spreadsheet (raw array-of-arrays format)
 * Used for AI analysis to determine column mapping
 */
export function getSpreadsheetPreview(
  fileBuffer: ArrayBuffer | Buffer,
  maxRows = 20
): any[][] | null {
  try {
    const workbook = XLSX.read(fileBuffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return null;
    }

    // Get raw array-of-arrays format
    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    return rawRows.slice(0, maxRows);
  } catch (error) {
    console.error("Error getting spreadsheet preview:", error);
    return null;
  }
}

/**
 * Parse spreadsheet with AI-determined mapping configuration
 */
export function parseWithMapping(
  fileBuffer: ArrayBuffer | Buffer,
  mappingConfig: MappingConfig
): NormalizedTransaction[] {
  try {
    const workbook = XLSX.read(fileBuffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    if (!sheet) {
      return [];
    }

    // Get raw rows
    const rawRows = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    });

    // Extract data rows (skip header and any rows above it)
    const dataRows = rawRows.slice(mappingConfig.headerRowIndex + 1);
    
    // Get conversion config from AI instructions
    const conversionConfig = convertInstructionsToConfig(mappingConfig.conversions);

    // Map and convert each row
    const transactions: NormalizedTransaction[] = dataRows.map((row) => {
      const rawRow: Record<string, any> = {};
      const transaction: NormalizedTransaction = { raw: {} };

      // Extract values using field mappings
      for (const [field, mapping] of Object.entries(mappingConfig.fieldMappings)) {
        if (mapping && mapping.columnIndex < row.length) {
          rawRow[field] = row[mapping.columnIndex];
        }
      }

      // Apply conversions
      const convertedRow = DataConverter.convertRow(rawRow, conversionConfig);

      // Map to transaction object
      transaction.transactionDate = convertedRow.transactionDate;
      transaction.postedDate = convertedRow.postedDate;
      transaction.description = convertedRow.description;
      transaction.amount = convertedRow.amount;
      transaction.debit = convertedRow.debit;
      transaction.credit = convertedRow.credit;
      transaction.balance = convertedRow.balance;
      transaction.category = convertedRow.category;
      transaction.merchantName = convertedRow.merchantName;
      transaction.referenceNumber = convertedRow.referenceNumber;
      transaction.raw = rawRow;

      return transaction;
    });

    return transactions;
  } catch (error) {
    console.error("Error parsing with mapping:", error);
    return [];
  }
}

