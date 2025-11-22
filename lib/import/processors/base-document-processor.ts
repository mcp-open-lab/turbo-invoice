/**
 * Base Document Processor
 * Abstract class for processing single-document OCR (receipts, invoices, etc.)
 */

import type { createId } from "@paralleldrive/cuid2";

export interface ProcessedDocument {
  // Document metadata
  documentId: string;
  documentType: "receipt" | "invoice";

  // Extracted fields (all optional - depends on document type)
  merchantName?: string | null;
  vendorName?: string | null;
  customerName?: string | null;

  // Dates
  date?: Date | null;
  invoiceDate?: Date | null;
  dueDate?: Date | null;

  // Amounts
  subtotal?: number | null;
  taxAmount?: number | null;
  totalAmount?: number | null;
  tipAmount?: number | null;

  // Tax breakdown (Canada)
  gstAmount?: number | null;
  hstAmount?: number | null;
  pstAmount?: number | null;

  // Tax breakdown (US)
  salesTaxAmount?: number | null;

  // Invoice-specific
  invoiceNumber?: string | null;
  poNumber?: string | null;
  amountPaid?: number | null;
  amountDue?: number | null;
  paymentTerms?: string | null;
  direction?: "in" | "out" | null;

  // Receipt-specific
  receiptNumber?: string | null;
  paymentMethod?: string | null;

  // Classification
  category?: string | null;
  categoryId?: string | null;
  description?: string | null;

  // Metadata
  currency: string;
  country?: string | null;
  province?: string | null;
  extractionConfidence?: number;
}

export interface DocumentProcessorConfig {
  userId: string;
  batchId?: string;
  country?: string | null;
  province?: string | null;
  currency?: string;
  usageType?: string | null;
}

/**
 * Abstract base class for document processors
 *
 * Responsibilities:
 * - Define the contract for OCR-based document processing
 * - Provide common utilities (field validation, AI prompting)
 * - Enforce separation between receipt and invoice processing
 */
export abstract class BaseDocumentProcessor {
  protected userId: string;
  protected batchId?: string;
  protected country?: string | null;
  protected province?: string | null;
  protected currency: string;
  protected usageType?: string | null;

  constructor(config: DocumentProcessorConfig) {
    this.userId = config.userId;
    this.batchId = config.batchId;
    this.country = config.country;
    this.province = config.province;
    this.currency = config.currency || "USD";
    this.usageType = config.usageType;
  }

  /**
   * Process a document (image/PDF) and extract fields
   * Main entry point - implemented by subclasses
   */
  abstract processDocument(
    fileUrl: string,
    fileName: string
  ): Promise<ProcessedDocument>;

  /**
   * Get document type identifier
   */
  abstract getDocumentType(): "receipt" | "invoice";

  /**
   * Get human-readable description
   */
  abstract getDescription(): string;

  /**
   * Get required fields for this document type
   */
  abstract getRequiredFields(): Set<string>;

  /**
   * Get optional fields for this document type
   */
  abstract getOptionalFields(): Set<string>;

  /**
   * Validate extracted data meets minimum requirements
   */
  protected validateExtractedData(data: Record<string, any>): {
    isValid: boolean;
    missingFields: string[];
  } {
    const requiredFields = this.getRequiredFields();
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!data[field] || data[field] === null || data[field] === undefined) {
        missingFields.push(field);
      }
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Common utility: Build tax extraction instructions
   */
  protected buildTaxInstructions(fieldsToExtract: Set<string>): string {
    if (
      !fieldsToExtract.has("taxAmount") &&
      !fieldsToExtract.has("gstAmount")
    ) {
      return "";
    }

    if (this.country === "CA") {
      return `Extract Canadian tax fields if present:
- GST (Goods and Services Tax) - federal tax
- HST (Harmonized Sales Tax) - combined GST+PST in some provinces
- PST (Provincial Sales Tax) - provincial tax
If only a total tax is shown, extract it as taxAmount.`;
    } else if (this.country === "US") {
      return `Extract US sales tax if present. Sales tax varies by state.`;
    }

    return "Extract tax amount if present.";
  }

  /**
   * Common utility: Build JSON schema for AI extraction
   */
  protected buildJsonSchema(fieldsToExtract: Set<string>): string {
    const jsonFields: string[] = [];

    // Common fields
    if (fieldsToExtract.has("merchantName")) {
      jsonFields.push('  "merchantName": "string or null"');
    }
    if (fieldsToExtract.has("vendorName")) {
      jsonFields.push('  "vendorName": "string or null"');
    }
    if (fieldsToExtract.has("date")) {
      jsonFields.push('  "date": "ISO 8601 date string (YYYY-MM-DD) or null"');
    }
    if (fieldsToExtract.has("invoiceDate")) {
      jsonFields.push(
        '  "invoiceDate": "ISO 8601 date string (YYYY-MM-DD) or null"'
      );
    }
    if (fieldsToExtract.has("dueDate")) {
      jsonFields.push(
        '  "dueDate": "ISO 8601 date string (YYYY-MM-DD) or null"'
      );
    }

    // Amount fields
    if (fieldsToExtract.has("totalAmount")) {
      jsonFields.push('  "totalAmount": number or null');
    }
    if (fieldsToExtract.has("subtotal")) {
      jsonFields.push('  "subtotal": number or null');
    }
    if (fieldsToExtract.has("taxAmount")) {
      jsonFields.push('  "taxAmount": number or null');
    }
    if (fieldsToExtract.has("gstAmount")) {
      jsonFields.push('  "gstAmount": number or null');
    }
    if (fieldsToExtract.has("hstAmount")) {
      jsonFields.push('  "hstAmount": number or null');
    }
    if (fieldsToExtract.has("pstAmount")) {
      jsonFields.push('  "pstAmount": number or null');
    }
    if (fieldsToExtract.has("salesTaxAmount")) {
      jsonFields.push('  "salesTaxAmount": number or null');
    }
    if (fieldsToExtract.has("tipAmount")) {
      jsonFields.push('  "tipAmount": number or null');
    }

    // Receipt-specific
    if (fieldsToExtract.has("receiptNumber")) {
      jsonFields.push('  "receiptNumber": "string or null"');
    }
    if (fieldsToExtract.has("paymentMethod")) {
      jsonFields.push('  "paymentMethod": "string or null"');
    }

    // Invoice-specific
    if (fieldsToExtract.has("invoiceNumber")) {
      jsonFields.push('  "invoiceNumber": "string or null"');
    }
    if (fieldsToExtract.has("poNumber")) {
      jsonFields.push('  "poNumber": "string or null"');
    }
    if (fieldsToExtract.has("amountPaid")) {
      jsonFields.push('  "amountPaid": number or null');
    }
    if (fieldsToExtract.has("amountDue")) {
      jsonFields.push('  "amountDue": number or null');
    }
    if (fieldsToExtract.has("customerName")) {
      jsonFields.push('  "customerName": "string or null"');
    }

    return `{\n${jsonFields.join(",\n")}\n}`;
  }

  /**
   * Common utility: Auto-categorize document
   */
  protected async categorizeDocument(
    merchantName: string | null,
    description: string | null,
    amount: string
  ): Promise<{ categoryId: string | null; categoryName: string | null }> {
    if (!merchantName && !description) {
      return { categoryId: null, categoryName: null };
    }

    try {
      const { CategoryEngine } = await import("@/lib/categorization/engine");
      const result = await CategoryEngine.categorizeWithAI(
        { merchantName, description, amount },
        { userId: this.userId, includeAI: true, minConfidence: 0.7 }
      );

      return {
        categoryId: result.categoryId || null,
        categoryName: result.categoryName || result.suggestedCategory || null,
      };
    } catch (error) {
      // Categorization is optional - don't fail the whole process
      return { categoryId: null, categoryName: null };
    }
  }
}
