/**
 * Queue job types for batch import processing
 * Type-safe job payload structures for Vercel Queues
 */

export type ImportType = "receipts" | "bank_statements" | "invoices" | "mixed";
export type FileFormat = "pdf" | "csv" | "xlsx" | "xls" | "jpg" | "png" | "webp" | "gif";

/**
 * Job payload for processing a single batch item
 */
export interface ImportJobPayload {
  batchId: string;
  batchItemId: string;
  fileUrl: string;
  fileName: string;
  fileFormat: FileFormat;
  userId: string;
  importType: ImportType;
  sourceFormat?: "pdf" | "csv" | "xlsx" | "images";
  order: number;
}

/**
 * Queue message wrapper
 */
export interface QueueMessage {
  id: string;
  data: ImportJobPayload;
  timestamp: number;
}

/**
 * Job processing result
 */
export interface JobProcessingResult {
  success: boolean;
  batchItemId: string;
  documentId?: string;
  error?: string;
  errorCode?: string;
}

