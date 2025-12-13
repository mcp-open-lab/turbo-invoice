"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/observability/log";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("App route error boundary triggered", error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <PageContainer size="tight">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          <Button asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </div>
      <div className="p-8 text-center text-muted-foreground border rounded-lg">
        Please try again. If this keeps happening, refresh the page.
      </div>
    </PageContainer>
  );
}


