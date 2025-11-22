import { z } from "zod";
import { generateObject } from "@/lib/ai/client";
import type { ConversionConfig } from "./field-converters";
import { CategoryFilterService } from "@/lib/categorization/category-filter";

/**
 * Schema for column field mapping
 */
const FieldMappingSchema = z.object({
  columnIndex: z.number().describe("0-based column index in the spreadsheet"),
  columnName: z.string().describe("Original column header name"),
});

/**
 * Schema for conversion instruction
 */
const ConversionInstructionSchema = z.object({
  field: z.string().describe("Target schema field name"),
  type: z.enum(["date", "amount", "description"]),
  format: z
    .string()
    .optional()
    .describe("Date format string like 'DD/MM/YYYY'"),
  excelSerial: z.boolean().optional(),
  reverseSign: z.boolean().optional().describe("For amounts: multiply by -1"),
  removeSymbols: z.boolean().optional(),
  handleParentheses: z.boolean().optional(),
  trim: z.boolean().optional(),
  removeInternalCodes: z.boolean().optional(),
});

/**
 * Schema for the AI mapping response
 */
const MappingConfigSchema = z.object({
  headerRowIndex: z.number().describe("0-based index of the header row"),
  fieldMappings: z.object({
    transactionDate: FieldMappingSchema.optional(),
    postedDate: FieldMappingSchema.optional(),
    description: FieldMappingSchema.optional(),
    amount: FieldMappingSchema.optional(),
    debit: FieldMappingSchema.optional(),
    credit: FieldMappingSchema.optional(),
    balance: FieldMappingSchema.optional(),
    category: FieldMappingSchema.optional(),
    merchantName: FieldMappingSchema.optional(),
    referenceNumber: FieldMappingSchema.optional(),
  }),
  conversions: z
    .array(ConversionInstructionSchema)
    .describe(
      "List of conversion instructions for transforming raw values to match schema"
    ),
  currency: z
    .string()
    .optional()
    .describe("Inferred currency code like USD, CAD, EUR"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score 0-1 for the mapping"),
});

export type MappingConfig = z.infer<typeof MappingConfigSchema>;
export type FieldMapping = z.infer<typeof FieldMappingSchema>;
export type ConversionInstruction = z.infer<typeof ConversionInstructionSchema>;

/**
 * Detect column mapping using AI analysis with full dataset statistics
 */
export async function detectColumnMapping(
  spreadsheetData: import("./spreadsheet-parser").SpreadsheetStats,
  userId?: string,
  statementType?: "bank_account" | "credit_card"
): Promise<MappingConfig | null> {
  if (!spreadsheetData || spreadsheetData.previewRows.length === 0) {
    return null;
  }

  const { previewRows, totalRows, amountStats } = spreadsheetData;

  // Format preview rows for the prompt
  const formattedPreview = previewRows
    .slice(0, 20)
    .map((row, idx) => {
      const cells = row
        .map((cell, colIdx) => `[${colIdx}]: ${JSON.stringify(cell)}`)
        .join(", ");
      return `Row ${idx}: ${cells}`;
    })
    .join("\n");

  // Get user's category preferences if userId is provided
  let categoryContext = "";
  if (userId) {
    try {
      const { incomeCategories, expenseCategories, userPreference } =
        await CategoryFilterService.getCategorizedListsForAI(userId);

      categoryContext = `

User's Financial Context:
- User Type: ${userPreference === "both" ? "Business & Personal" : userPreference.charAt(0).toUpperCase() + userPreference.slice(1)}
- Income Categories: ${incomeCategories.join(", ")}
- Expense Categories: ${expenseCategories.join(", ")}

Use these categories when mapping the "category" field if present in the data.`;
    } catch (error) {
      // Silently fail if we can't get categories - not critical for mapping
    }
  }

  // Construct specific instructions based on statement type
  let signConventionInstructions = "";

  if (statementType === "credit_card") {
    signConventionInstructions = `
CRITICAL INSTRUCTION: USER SELECTED "CREDIT CARD"
- In Credit Card statements, a single "Amount" column usually shows PURCHASES (expenses) as POSITIVE numbers.
- REQUIRED ACTION: Set "reverseSign": true for the Amount column (unless separate Debit/Credit columns exist).
- If separate "Debit" (purchase) and "Credit" (payment) columns exist, map them directly and do NOT set reverseSign.
`;
  } else if (statementType === "bank_account") {
    signConventionInstructions = `
CRITICAL INSTRUCTION: USER SELECTED "BANK ACCOUNT"
- In Bank statements, a single "Amount" column usually shows WITHDRAWALS (expenses) as NEGATIVE numbers.
- REQUIRED ACTION: Set "reverseSign": false for the Amount column (standard accounting).
- If separate "Debit" and "Credit" columns exist, map them directly.
`;
  } else {
    // Fallback to statistical analysis if no type selected
    const positivePercent = amountStats?.positivePercent ?? 0;
    signConventionInstructions = `
CRITICAL INSTRUCTION: NO STATEMENT TYPE SELECTED - ANALYZE PATTERNS
- Statistical Analysis of ${totalRows} rows: ${positivePercent}% of amounts are positive.
- Decision Logic:
  * If >80% positive → Likely Credit Card or Positive-Expense Bank Statement → Set "reverseSign": true
  * If <20% positive → Likely Standard Bank Statement → Set "reverseSign": false
  * If Mixed → Standard accounting → Set "reverseSign": false
`;
  }

  const prompt = `You are a financial data extraction expert. Map the spreadsheet columns to standard fields.

${categoryContext}

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
5. "description": Main transaction text column.
6. "balance": Account balance column (if present).
7. Only include fields and conversions that exist in the spreadsheet.
8. Return JSON only.`;

  const result = await generateObject(prompt, MappingConfigSchema, {
    temperature: 0.1,
  });

  if (!result.success || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * Convert AI conversion instructions to ConversionConfig objects
 */
export function convertInstructionsToConfig(
  instructions: ConversionInstruction[]
): Record<string, ConversionConfig> {
  const config: Record<string, ConversionConfig> = {};

  for (const instruction of instructions) {
    const { field, type } = instruction;

    if (type === "date") {
      config[field] = {
        type: "date",
        format: instruction.format,
        excelSerial: instruction.excelSerial,
      };
    } else if (type === "amount") {
      config[field] = {
        type: "amount",
        reverseSign: instruction.reverseSign,
        removeSymbols: instruction.removeSymbols,
        handleParentheses: instruction.handleParentheses,
      };
    } else if (type === "description") {
      config[field] = {
        type: "description",
        trim: instruction.trim,
        removeInternalCodes: instruction.removeInternalCodes,
      };
    }
  }

  return config;
}
