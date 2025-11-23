/**
 * Receipt Extraction Prompt Builder
 * Centralized prompt management for receipt OCR extraction
 */

export interface ReceiptExtractionConfig {
  requiredFields: string[];
  preferredFields: string[];
  optionalFields: string[];
  country?: string | null;
  currency: string;
  jsonSchema: any;
}

export class ReceiptExtractionPrompt {
  static build(config: ReceiptExtractionConfig): string {
    const { requiredFields, preferredFields, optionalFields, jsonSchema } =
      config;

    const requiredSection = this.buildRequiredFields(requiredFields);
    const preferredSection = this.buildPreferredFields(preferredFields);
    const optionalSection = this.buildOptionalFields(optionalFields);

    return `Extract information from this receipt image.

CRITICAL: Read the ACTUAL merchant/business name printed on the receipt. Do NOT guess common names like "Starbucks", "Chipotle", "Target" unless that exact name appears on the receipt.

${requiredSection}${preferredSection}${optionalSection}

Return as JSON. Use null if a field is not found. Dates: YYYY-MM-DD format. Amounts: numbers.

JSON schema:
${JSON.stringify(jsonSchema, null, 2)}`;
  }

  private static buildRequiredFields(fields: string[]): string {
    if (fields.length === 0) return "";

    const fieldDescriptions = fields.map((f) => {
      if (f === "date") return "- date: Transaction date (format: YYYY-MM-DD)";
      if (f === "totalAmount")
        return "- totalAmount: Final total amount (number)";
      return `- ${f}`;
    });

    return `Required fields:
${fieldDescriptions.join("\n")}

`;
  }

  private static buildPreferredFields(fields: string[]): string {
    if (fields.length === 0) return "";

    const fieldDescriptions = fields.map((f) => {
      if (f === "merchantName")
        return "- merchantName: Business/merchant name shown on receipt";
      return `- ${f}`;
    });

    return `Preferred fields:
${fieldDescriptions.join("\n")}

`;
  }

  private static buildOptionalFields(fields: string[]): string {
    if (fields.length === 0) return "";

    return `Optional fields:
${fields.map((f) => `- ${f}`).join("\n")}

`;
  }
}
