import { getSpreadsheetPreview, parseWithMapping, type NormalizedTransaction } from "./spreadsheet-parser";
import { detectColumnMapping, type MappingConfig } from "./ai-column-mapper";
import { devLogger } from "@/lib/dev-logger";

export interface ImportResult {
  success: boolean;
  transactions: NormalizedTransaction[];
  mappingConfig?: MappingConfig;
  error?: string;
  metadata?: {
    totalRows: number;
    validRows: number;
    currency?: string;
    mappingConfidence?: number;
  };
}

/**
 * Orchestrate the entire import process for spreadsheet files
 * Steps:
 * 1. Load file buffer
 * 2. Extract preview rows
 * 3. Use AI to detect column mapping
 * 4. Parse full file with detected mapping
 * 5. Return normalized transactions
 */
export async function importSpreadsheet(
  fileBuffer: ArrayBuffer | Buffer,
  fileName: string
): Promise<ImportResult> {
  try {
    devLogger.info("Starting spreadsheet import orchestration", {
      context: { fileName },
    });

    // Step 1: Get preview rows for AI analysis
    const previewRows = getSpreadsheetPreview(fileBuffer, 20);
    
    if (!previewRows || previewRows.length === 0) {
      return {
        success: false,
        transactions: [],
        error: "Unable to read spreadsheet or file is empty",
      };
    }

    devLogger.info("Preview extracted", {
      context: { rowCount: previewRows.length },
    });

    // Step 2: Use AI to detect column mapping
    const mappingConfig = await detectColumnMapping(previewRows);
    
    if (!mappingConfig) {
      return {
        success: false,
        transactions: [],
        error: "Failed to detect column mapping. AI analysis returned no mapping configuration.",
      };
    }

    devLogger.info("Column mapping detected", {
      context: {
        headerRowIndex: mappingConfig.headerRowIndex,
        fieldCount: Object.keys(mappingConfig.fieldMappings).length,
        confidence: mappingConfig.confidence,
        currency: mappingConfig.currency,
      },
    });

    // Step 3: Parse full file with detected mapping
    const transactions = parseWithMapping(fileBuffer, mappingConfig);

    if (transactions.length === 0) {
      return {
        success: false,
        transactions: [],
        mappingConfig,
        error: "No transactions found in file after parsing",
      };
    }

    // Step 4: Filter out invalid transactions (e.g., no date or amount)
    const validTransactions = transactions.filter((tx) => {
      // Must have at least a date and either amount or debit/credit
      const hasDate = tx.transactionDate !== null && tx.transactionDate !== undefined;
      const hasAmount = 
        (tx.amount !== null && tx.amount !== undefined) ||
        (tx.debit !== null && tx.debit !== undefined) ||
        (tx.credit !== null && tx.credit !== undefined);
      
      return hasDate && hasAmount;
    });

    devLogger.info("Spreadsheet import completed", {
      context: {
        totalRows: transactions.length,
        validRows: validTransactions.length,
        invalidRows: transactions.length - validTransactions.length,
      },
    });

    return {
      success: true,
      transactions: validTransactions,
      mappingConfig,
      metadata: {
        totalRows: transactions.length,
        validRows: validTransactions.length,
        currency: mappingConfig.currency,
        mappingConfidence: mappingConfig.confidence,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    devLogger.error("Spreadsheet import orchestration failed", {
      context: { error: errorMessage, fileName },
    });

    return {
      success: false,
      transactions: [],
      error: `Import failed: ${errorMessage}`,
    };
  }
}

/**
 * Validate that a file can be imported as a spreadsheet
 */
export function isSpreadsheetFile(fileName: string): boolean {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return ["csv", "xlsx", "xls"].includes(extension || "");
}

