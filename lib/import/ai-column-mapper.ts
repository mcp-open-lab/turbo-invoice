import { z } from "zod";
import { generateObject } from "@/lib/ai/client";
import type { ConversionConfig } from "./field-converters";

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
  format: z.string().optional().describe("Date format string like 'DD/MM/YYYY'"),
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
  conversions: z.array(ConversionInstructionSchema).describe(
    "List of conversion instructions for transforming raw values to match schema"
  ),
  currency: z.string().optional().describe("Inferred currency code like USD, CAD, EUR"),
  confidence: z.number().min(0).max(1).describe("Confidence score 0-1 for the mapping"),
});

export type MappingConfig = z.infer<typeof MappingConfigSchema>;
export type FieldMapping = z.infer<typeof FieldMappingSchema>;
export type ConversionInstruction = z.infer<typeof ConversionInstructionSchema>;

/**
 * Detect column mapping using AI analysis
 */
export async function detectColumnMapping(
  previewRows: any[][]
): Promise<MappingConfig | null> {
  if (!previewRows || previewRows.length === 0) {
    return null;
  }

  // Format preview rows for the prompt
  const formattedPreview = previewRows
    .slice(0, 20)
    .map((row, idx) => {
      const cells = row.map((cell, colIdx) => `[${colIdx}]: ${JSON.stringify(cell)}`).join(", ");
      return `Row ${idx}: ${cells}`;
    })
    .join("\n");

  const prompt = `You are analyzing a spreadsheet file that contains financial transaction data (likely a bank statement or transaction export).

Your task is to:
1. Identify the header row (the row containing column labels)
2. Map each column to our standard schema fields
3. Determine what data conversions are needed for each field

Preview of the first rows:
${formattedPreview}

Standard schema fields we need to map to:
- transactionDate: The date the transaction occurred
- postedDate: The date the transaction was posted (if different from transaction date)
- description: Transaction description or memo
- amount: Single amount column (positive for credits, negative for debits)
- debit: Debit/withdrawal amount (if separate from credits)
- credit: Credit/deposit amount (if separate from debits)
- balance: Running balance after transaction
- category: Transaction category or type
- merchantName: Merchant or payee name
- referenceNumber: Transaction reference, check number, or ID

Important notes:
- Some statements use a single "Amount" column (signed), others use separate "Debit" and "Credit" columns
- Date formats vary (MM/DD/YYYY, DD/MM/YYYY, Excel serial numbers, etc.)
- Amounts may have currency symbols ($, €), thousands separators (,), or parentheses for negatives (100.00)
- Not all fields will be present in every file
- The header row might not be row 0 (some files have title rows above headers)

For conversions:
- Specify date format if it's ambiguous (e.g., "DD/MM/YYYY" vs "MM/DD/YYYY")
- Mark excelSerial: true if dates are Excel serial numbers
- Set reverseSign: true if debits are shown as positive but should be negative
- Set handleParentheses: true if negative amounts use parentheses notation

Return your analysis as a structured mapping configuration.`;

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

