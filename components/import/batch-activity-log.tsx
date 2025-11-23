"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getBatchActivityLogs,
  type BatchActivityLog,
} from "@/app/actions/batch-activity";
import { formatDistanceToNow } from "date-fns";
import { Activity, Loader2 } from "lucide-react";

interface BatchActivityLogProps {
  batchId: string;
  initialLogs?: BatchActivityLog[];
}

export function BatchActivityLog({
  batchId,
  initialLogs = [],
}: BatchActivityLogProps) {
  const [logs, setLogs] = useState<BatchActivityLog[]>(initialLogs);
  const [isLoading, setIsLoading] = useState(false);

  // Poll for new activity logs every 2 seconds
  useEffect(() => {
    let isMounted = true;

    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const newLogs = await getBatchActivityLogs(batchId);
        if (isMounted && newLogs.length > 0) {
          // Only update if we got logs back (don't replace with empty array)
          setLogs(newLogs);
        }
      } catch (error) {
        console.error("Failed to fetch activity logs:", error);
        // Keep existing logs on error - don't clear them
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch if no initial logs provided
    if (initialLogs.length === 0) {
      fetchLogs();
    }

    // Poll every 2 seconds for updates
    const interval = setInterval(fetchLogs, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [batchId, initialLogs.length]);

  const getActivityIcon = (activityType: string) => {
    const icons: Record<string, string> = {
      batch_created: "📦",
      file_uploaded: "📁",
      ai_extraction_start: "🤖",
      ai_extraction_complete: "✅",
      ai_categorization_start: "🧠",
      ai_categorization_complete: "🏷️",
      duplicate_detected: "⚠️",
      item_completed: "✅",
      item_failed: "❌",
      batch_completed: "🎉",
    };
    return icons[activityType] || "•";
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Activity Log</CardTitle>
          </div>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="text-sm text-muted-foreground">Real-time AI processing</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Activity className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={log.id}
                  className={`flex gap-3 p-3 rounded-lg border transition-all ${
                    index === 0 && logs.length > 1
                      ? "bg-primary/5 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex-shrink-0 text-2xl leading-none">
                    {getActivityIcon(log.activityType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-relaxed break-words">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(log.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {log.duration && (
                        <>
                          <span>•</span>
                          <span>{formatDuration(log.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
