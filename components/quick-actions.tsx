"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scanReceipt } from "@/app/actions/scan-receipt";
import { Camera, Upload, X } from "lucide-react";
import { future_genUploader } from "uploadthing/client-future";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Get API URL from window location (works in browser)
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return new URL("/api/uploadthing", window.location.origin);
  }
  return new URL(
    "/api/uploadthing",
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  );
};

// Downscale large camera images before upload to keep them fast and under limits
async function compressImageFile(
  file: File,
  maxSize = 1800,
  quality = 0.8
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const imageUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = imageUrl;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (err) => reject(err);
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const { width, height } = img;
    const maxDim = Math.max(width, height);
    const scale = maxDim > maxSize ? maxSize / maxDim : 1;

    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((result) => resolve(result), "image/jpeg", quality)
    );

    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".quick-actions-menu")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setIsOpen(false);

    try {
      toast.info("Uploading receipt...");

      const compressedFiles = await Promise.all(
        Array.from(files).map((file) => compressImageFile(file))
      );

      const uploader = future_genUploader<OurFileRouter>({
        url: getApiUrl(),
      });

      const uploadedFiles = await uploader.uploadFiles("receiptUploader", {
        files: compressedFiles,
        onEvent: (event) => {
          if (event.type === "upload-progress") {
            const progress = Math.round(
              (event.file.sent / event.file.size) * 100
            );
            toast.info(`Uploading... ${progress}%`);
          }
        },
      });

      if (
        uploadedFiles &&
        uploadedFiles[0] &&
        uploadedFiles[0].status === "uploaded"
      ) {
        toast.info("Processing receipt with AI...");
        await scanReceipt(uploadedFiles[0].url);
        toast.success("Receipt processed!");
        router.refresh();
      }
    } catch (error) {
      console.error("[Quick Actions] Upload error:", error);
      toast.error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
        disabled={isUploading}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Quick Actions Menu */}
      <div className="fixed bottom-4 right-4 z-50 quick-actions-menu">
        {/* Fan-out buttons */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2">
            {/* Camera Button */}
            <Button
              onClick={handleCameraClick}
              disabled={isUploading}
              className="rounded-full w-14 h-14 p-0 shadow-lg bg-primary text-primary-foreground animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: "0ms" }}
            >
              <Camera className="w-6 h-6" />
            </Button>

            {/* File Upload Button */}
            <Button
              onClick={handleFileUploadClick}
              disabled={isUploading}
              className="rounded-full w-14 h-14 p-0 shadow-lg bg-primary text-primary-foreground animate-in fade-in slide-in-from-bottom-2"
              style={{ animationDelay: "50ms" }}
            >
              <Upload className="w-6 h-6" />
            </Button>
          </div>
        )}

        {/* Main FAB Button */}
        <Button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isUploading}
          className={`rounded-full w-16 h-16 p-0 shadow-xl transition-all duration-300 ${
            isOpen
              ? "bg-destructive hover:bg-destructive/90 rotate-45"
              : "bg-primary hover:bg-primary/90"
          } text-primary-foreground`}
        >
          {isOpen ? <X className="w-8 h-8" /> : <Camera className="w-8 h-8" />}
        </Button>
      </div>
    </>
  );
}
