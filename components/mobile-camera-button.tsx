'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scanReceipt } from "@/app/actions/scan-receipt";
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const UploadButton = generateUploadButton<OurFileRouter>();

export function MobileCameraButton() {
  const [isMobile, setIsMobile] = useState(false);
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const storedPreference = localStorage.getItem("ti-camera-visible");
    if (storedPreference !== null) {
      setVisible(storedPreference === "true");
    }

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  if (!isMobile) {
    return null;
  }

  const toggleVisible = () => {
    const next = !visible;
    setVisible(next);
    localStorage.setItem("ti-camera-visible", JSON.stringify(next));
  };

  return (
    <>
      {visible && (
        <div className="fixed bottom-24 inset-x-0 flex justify-center md:hidden z-40">
          <UploadButton
            endpoint="receiptUploader"
            // @ts-ignore uploadthing appearance prop
            appearance={{
              button:
                "rounded-full px-6 py-6 text-base shadow-lg bg-primary text-primary-foreground",
              container: "pointer-events-auto",
            }}
            content={{
              button({ ready, isUploading }) {
                if (!ready) return "Preparing...";
                if (isUploading) return "Uploading...";
                return "Quick Scan";
              },
            }}
            onClientUploadComplete={async (res) => {
              if (res && res[0]) {
                toast.info("Processing receipt with AI...");
                try {
                  await scanReceipt(res[0].url);
                  toast.success("Receipt processed!");
                  router.refresh();
                } catch (error) {
                  console.error("[Camera Button] Processing error:", error);
                  toast.error("Processing failed. Please try again.");
                }
              }
            }}
            onUploadError={(error) => {
              console.error("[Camera Button] Upload error:", error);
              toast.error(`Upload failed: ${error.message}`);
            }}
          />
        </div>
      )}

      <div className="fixed bottom-4 right-4 md:hidden z-40 pointer-events-none">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleVisible}
          className="pointer-events-auto"
        >
          {visible ? "Hide Camera" : "Show Camera"}
        </Button>
      </div>
    </>
  );
}

