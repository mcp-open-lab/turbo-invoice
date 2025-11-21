/**
 * Inngest API route handler
 * Handles Inngest webhooks and function registration
 */

import { serve } from "inngest/next";
import { processBatchItem } from "@/lib/import/process-batch-item";
import type { ImportJobPayload } from "@/lib/import/queue-types";
import { devLogger } from "@/lib/dev-logger";
import { inngest } from "@/lib/inngest/client";

/**
 * Inngest function to process batch import items
 */
export const processImportJob = inngest.createFunction(
  {
    id: "process-import-job",
    name: "Process Import Job",
    retries: 3,
  },
  { event: "import/process.item" },
  async ({ event, step }) => {
    const payload = event.data as ImportJobPayload;

    devLogger.info("Processing import job", {
      eventId: event.id,
      batchItemId: payload.batchItemId,
      fileName: payload.fileName,
      batchId: payload.batchId,
    });

    return await step.run("process-batch-item", async () => {
      const result = await processBatchItem(payload);

      if (!result.success) {
        devLogger.error("Import job failed", {
          batchItemId: payload.batchItemId,
          error: result.error,
        });
        throw new Error(result.error || "Processing failed");
      }

      devLogger.info("Import job completed successfully", {
        batchItemId: payload.batchItemId,
        documentId: result.documentId,
      });

      return result;
    });
  }
);

// Export the Inngest serve handler
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processImportJob],
});

