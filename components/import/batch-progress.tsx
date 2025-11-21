"use client";

import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchProgressProps {
  processed: number;
  total: number;
  successful?: number;
  failed?: number;
  status?: "pending" | "processing" | "completed" | "failed";
  statusMessage?: string;
}

export function BatchProgress({
  processed,
  total,
  successful = 0,
  failed = 0,
  status = "pending",
  statusMessage,
}: BatchProgressProps) {
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    if (statusMessage) return statusMessage;
    switch (status) {
      case "completed":
        return "Batch processing completed";
      case "failed":
        return "Batch processing failed";
      case "processing":
        return "Processing files...";
      default:
        return "Ready to process";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {processed} of {total}
        </span>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {successful > 0 && (
          <span className="text-green-600">
            {successful} successful
          </span>
        )}
        {failed > 0 && (
          <span className="text-destructive">
            {failed} failed
          </span>
        )}
        {total - processed > 0 && status === "processing" && (
          <span>{total - processed} remaining</span>
        )}
      </div>
    </div>
  );
}

