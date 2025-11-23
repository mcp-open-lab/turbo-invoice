/**
 * Receipt Processor
 *
 * Handles receipt OCR extraction with specific fields:
 * - Merchant name, date, amounts
 * - Tax breakdown (GST/HST/PST for CA, sales tax for US)
 * - Tip amount, discount amount
 * - Payment method
 * - Business purpose and classification
 */

import {
  BaseDocumentProcessor,
  type ProcessedDocument,
  type DocumentProcessorConfig,
} from "./base-document-processor";
import { generateObject } from "@/lib/ai/client";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { devLogger } from "@/lib/dev-logger";

export class ReceiptProcessor extends BaseDocumentProcessor {
  constructor(config: DocumentProcessorConfig) {
    super(config);
  }

  getDocumentType(): "receipt" {
    return "receipt";
  }

  getDescription(): string {
    return "Receipt - Extract merchant, amounts, taxes, tips, and payment method";
  }

  getRequiredFields(): Set<string> {
    // Minimum fields needed for a valid receipt
    // merchantName is preferred but not required - some receipts don't have clear merchant names
    return new Set(["date", "totalAmount"]);
  }

  getOptionalFields(): Set<string> {
    return new Set([
      "subtotal",
      "taxAmount",
      "gstAmount",
      "hstAmount",
      "pstAmount",
      "salesTaxAmount",
      "tipAmount",
      "discountAmount",
      "receiptNumber",
      "paymentMethod",
      "category",
      "description",
      "businessPurpose",
      "isBusinessExpense",
    ]);
  }

  async processDocument(
    fileUrl: string,
    fileName: string
  ): Promise<ProcessedDocument> {
    devLogger.info("Processing receipt", {
      fileName,
      userId: this.userId,
      country: this.country,
      currency: this.currency,
    });

    // Build fields to extract based on config
    const fieldsToExtract = this.getFieldsToExtract();

    // Download and convert image to base64
    const imageResp = await fetch(fileUrl);
    if (!imageResp.ok) {
      throw new Error(`Failed to fetch image: ${imageResp.statusText}`);
    }

    const imageBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Call Gemini API for OCR
    const extractedData = await this.extractWithGemini(
      base64Image,
      fileUrl,
      fieldsToExtract
    );

    // Validate minimum requirements - throw error if missing required fields
    const validation = this.validateExtractedData(extractedData);
    if (!validation.isValid) {
      devLogger.error("Receipt extraction missing required fields", {
        missingFields: validation.missingFields,
        fileName: fileName || "unknown",
      });
      throw new Error(
        `Failed to extract required fields from receipt: ${validation.missingFields.join(
          ", "
        )}. The image may be unclear or not a valid receipt.`
      );
    }

    // Auto-categorize if merchant name is present
    let categoryId: string | null = null;
    let categoryName: string | null = extractedData.category || null;

    if (extractedData.merchantName) {
      const catResult = await this.categorizeDocument(
        extractedData.merchantName,
        extractedData.description || null,
        extractedData.totalAmount?.toString() || "0"
      );
      categoryId = catResult.categoryId;
      if (!categoryName) {
        categoryName = catResult.categoryName;
      }
    }

    // Return processed document
    return {
      documentId: "", // Will be set by caller
      documentType: "receipt",
      merchantName: extractedData.merchantName || null,
      date: extractedData.date ? new Date(extractedData.date) : null,
      subtotal: extractedData.subtotal || null,
      taxAmount: extractedData.taxAmount || null,
      totalAmount: extractedData.totalAmount || null,
      gstAmount: extractedData.gstAmount || null,
      hstAmount: extractedData.hstAmount || null,
      pstAmount: extractedData.pstAmount || null,
      salesTaxAmount: extractedData.salesTaxAmount || null,
      tipAmount: extractedData.tipAmount || null,
      receiptNumber: extractedData.receiptNumber || null,
      paymentMethod: extractedData.paymentMethod || null,
      category: categoryName,
      categoryId,
      description: extractedData.description || null,
      currency: this.currency,
      country: this.country,
      province: extractedData.province || null,
      extractionConfidence: 0.9, // TODO: Calculate based on field coverage
    };
  }

  private getFieldsToExtract(): Set<string> {
    const fields = new Set<string>();

    // Always extract core fields
    fields.add("merchantName");
    fields.add("date");
    fields.add("totalAmount");

    // Add optional fields based on country
    fields.add("subtotal");
    fields.add("taxAmount");

    if (this.country === "CA") {
      fields.add("gstAmount");
      fields.add("hstAmount");
      fields.add("pstAmount");
    } else if (this.country === "US") {
      fields.add("salesTaxAmount");
    }

    fields.add("tipAmount");
    fields.add("discountAmount");
    fields.add("receiptNumber");
    fields.add("paymentMethod");
    fields.add("category");
    fields.add("description");

    return fields;
  }

  private async extractWithGemini(
    base64Image: string,
    imageUrl: string,
    fieldsToExtract: Set<string>
  ): Promise<Record<string, any>> {
    // Build Zod schema for structured output
    const receiptSchema = this.buildReceiptSchema(fieldsToExtract);

    // Convert Zod schema to JSON Schema for prompt
    const jsonSchema = zodToJsonSchema(receiptSchema, "ReceiptData");

    // Build prompt with explicit JSON schema and field names
    // date and totalAmount are truly required; merchantName is highly preferred but not required
    const requiredFields = Array.from(fieldsToExtract).filter((f) =>
      ["date", "totalAmount"].includes(f)
    );
    const preferredFields = Array.from(fieldsToExtract).filter(
      (f) => f === "merchantName"
    );
    const optionalFields = Array.from(fieldsToExtract).filter(
      (f) => !["merchantName", "date", "totalAmount"].includes(f)
    );

    // Build simple, direct prompt based on what works
    const fieldDescriptions: string[] = [];

    if (requiredFields.includes("date")) {
      fieldDescriptions.push("date: Transaction date (ISO format: YYYY-MM-DD)");
    }
    if (requiredFields.includes("totalAmount")) {
      fieldDescriptions.push("totalAmount: Final total amount (number)");
    }
    if (preferredFields.includes("merchantName")) {
      fieldDescriptions.push(
        "merchantName: Business/merchant name (extract the actual name shown on receipt)"
      );
    }
    optionalFields.forEach((f) => {
      if (f === "subtotal")
        fieldDescriptions.push("subtotal: Subtotal before tax (number)");
      else if (f === "taxAmount")
        fieldDescriptions.push("taxAmount: Tax amount (number)");
      else if (
        f.startsWith("gst") ||
        f.startsWith("hst") ||
        f.startsWith("pst") ||
        f.startsWith("salesTax")
      ) {
        fieldDescriptions.push(`${f}: Tax breakdown (number)`);
      } else if (f === "tipAmount")
        fieldDescriptions.push("tipAmount: Tip amount (number)");
      else if (f === "paymentMethod")
        fieldDescriptions.push("paymentMethod: Payment method (string)");
      else if (f === "description")
        fieldDescriptions.push("description: Description/notes (string)");
      else fieldDescriptions.push(`${f}: ${f}`);
    });

    // Ultra-simple prompt - just ask for the data directly
    const prompt = `Extract information from this receipt image.

CRITICAL: Read the ACTUAL merchant/business name printed on the receipt. Do NOT guess common names like "Starbucks", "Chipotle", "Target" unless that exact name appears on the receipt.

Required fields:
${requiredFields
  .map((f) => {
    if (f === "date") return "- date: Transaction date (format: YYYY-MM-DD)";
    if (f === "totalAmount")
      return "- totalAmount: Final total amount (number)";
    return `- ${f}`;
  })
  .join("\n")}

${
  preferredFields.length > 0
    ? `\nPreferred fields:\n${preferredFields
        .map((f) => {
          if (f === "merchantName")
            return "- merchantName: Business/merchant name shown on receipt";
          return `- ${f}`;
        })
        .join("\n")}\n`
    : ""
}
${
  optionalFields.length > 0
    ? `\nOptional fields:\n${optionalFields.map((f) => `- ${f}`).join("\n")}\n`
    : ""
}

Return as JSON. Use null if a field is not found. Dates: YYYY-MM-DD format. Amounts: numbers.

JSON schema:
${JSON.stringify(jsonSchema, null, 2)}`;

    devLogger.debug(
      "Calling AI for receipt extraction with structured output",
      {
        userId: this.userId,
        fieldsToExtract: Array.from(fieldsToExtract),
        country: this.country,
        currency: this.currency,
      }
    );

    // Get MIME type from URL
    const imageMimeType = this.getMimeType(imageUrl);

    // Call AI with structured output (Zod schema enforces structure)
    const result = await generateObject(prompt, receiptSchema, {
      image: { data: base64Image, mimeType: imageMimeType },
      temperature: 0.1,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || "AI extraction failed");
    }

    devLogger.info("Receipt extraction completed", {
      hasMerchantName: !!result.data.merchantName,
      merchantName: result.data.merchantName || null, // Log actual value to debug hallucinations
      hasDate: !!result.data.date,
      date: result.data.date || null,
      hasTotalAmount: !!result.data.totalAmount,
      totalAmount: result.data.totalAmount || null,
      provider: result.provider,
    });

    return result.data as Record<string, any>;
  }

  private buildReceiptSchema(fieldsToExtract: Set<string>): z.ZodSchema {
    const schemaFields: Record<string, z.ZodType> = {};

    if (fieldsToExtract.has("merchantName")) {
      schemaFields.merchantName = z.string().nullable();
    }
    if (fieldsToExtract.has("date")) {
      schemaFields.date = z.string().nullable();
    }
    if (fieldsToExtract.has("totalAmount")) {
      schemaFields.totalAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("subtotal")) {
      schemaFields.subtotal = z.number().nullable();
    }
    if (fieldsToExtract.has("taxAmount")) {
      schemaFields.taxAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("gstAmount")) {
      schemaFields.gstAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("hstAmount")) {
      schemaFields.hstAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("pstAmount")) {
      schemaFields.pstAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("salesTaxAmount")) {
      schemaFields.salesTaxAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("tipAmount")) {
      schemaFields.tipAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("discountAmount")) {
      schemaFields.discountAmount = z.number().nullable();
    }
    if (fieldsToExtract.has("receiptNumber")) {
      schemaFields.receiptNumber = z.string().nullable();
    }
    if (fieldsToExtract.has("paymentMethod")) {
      schemaFields.paymentMethod = z.string().nullable();
    }
    if (fieldsToExtract.has("category")) {
      schemaFields.category = z.string().nullable();
    }
    if (fieldsToExtract.has("description")) {
      schemaFields.description = z.string().nullable();
    }

    return z.object(schemaFields);
  }

  private getMimeType(url: string): string {
    const ext = url.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      case "gif":
        return "image/gif";
      default:
        return "image/jpeg";
    }
  }
}
