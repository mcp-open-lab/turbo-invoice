'use client';

import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { scanReceipt } from "@/app/actions/scan-receipt";
import { toast } from "sonner";

const UploadButton = generateUploadButton<OurFileRouter>();

export function ReceiptUploader() {
  return (
    <div className="p-8 border-2 border-dashed rounded-xl text-center">
      <UploadButton
        endpoint="receiptUploader"
        onClientUploadComplete={async (res) => {
          if (res && res[0]) {
            toast.info("Processing receipt with AI...");
            await scanReceipt(res[0].url);
            toast.success("Receipt processed!");
          }
        }}
        onUploadError={(error: Error) => {
          toast.error(`Error: ${error.message}`);
        }}
      />
    </div>
  );
}

