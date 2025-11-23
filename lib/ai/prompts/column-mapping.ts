/**
 * Column Mapping Prompt Builder
 * Centralized prompt management for spreadsheet column mapping
 */

export interface ColumnMappingConfig {
  categoryContext?: string;
  signConventionInstructions: string;
  formattedPreview: string;
}

export class ColumnMappingPrompt {
  static build(config: ColumnMappingConfig): string {
    const { categoryContext, signConventionInstructions, formattedPreview } = config;

    return `You are a financial data extraction expert. Map the spreadsheet columns to standard fields.

${categoryContext || ""}

${signConventionInstructions}

Preview of the first 20 rows:
${formattedPreview}

IMPORTANT: Follow the CRITICAL INSTRUCTIONS above to determine sign convention.

Return a JSON object with this EXACT structure:
{
  "headerRowIndex": <number>,
  "fieldMappings": {
    "transactionDate": { "columnIndex": <number>, "columnName": "<header name>" },
    "postedDate": { "columnIndex": <number>, "columnName": "<header name>" },
    "description": { "columnIndex": <number>, "columnName": "<header name>" },
    "amount": { "columnIndex": <number>, "columnName": "<header name>" },
    "debit": { "columnIndex": <number>, "columnName": "<header name>" },
    "credit": { "columnIndex": <number>, "columnName": "<header name>" },
    "balance": { "columnIndex": <number>, "columnName": "<header name>" },
    "merchantName": { "columnIndex": <number>, "columnName": "<header name>" },
    "referenceNumber": { "columnIndex": <number>, "columnName": "<header name>" }
  },
  "conversions": [
    { "field": "amount", "type": "amount", "reverseSign": <boolean>, "removeSymbols": true },
    { "field": "debit", "type": "amount", "removeSymbols": true },
    { "field": "credit", "type": "amount", "removeSymbols": true }
  ],
  "currency": "CAD",
  "confidence": 0.95
}

Rules:
1. PRIORITY: If separate "Debit" and "Credit" columns exist, map BOTH to "debit" and "credit" fields. Do NOT map "amount" in this case.
2. CRITICAL: If debit/credit columns are mapped, you MUST include conversion instructions for both: { "field": "debit", "type": "amount" } and { "field": "credit", "type": "amount" }
3. If only a single "Amount" column exists, map it to "amount" and follow CRITICAL INSTRUCTIONS for "reverseSign".
4. "transactionDate": Primary date column.
5. "description": Main transaction text column (usually contains merchant/vendor name).
6. "merchantName": CRITICAL - Extract merchant/vendor names from transaction descriptions. If a separate merchant/vendor column exists, map it. If not, analyze the description column and extract the merchant name (e.g., from "STARBUCKS #1234" extract "STARBUCKS", from "AMAZON.COM PURCHASE" extract "AMAZON.COM"). You can map the same column to both "description" and "merchantName" if needed. Always try to extract merchant names - do not leave merchantName as null if the description contains identifiable merchant information.
7. "balance": Account balance column (if present).
8. Only include fields and conversions that exist in the spreadsheet.
9. Return JSON only.`;
  }
}

