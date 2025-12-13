"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layouts/page-container";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void error;
  }, [error]);

  return (
    <PageContainer size="tight">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Batch Details</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={reset}>
            Try again
          </Button>
          <Button asChild>
            <Link href="/app/import?tab=jobs">Back to batches</Link>
          </Button>
        </div>
      </div>
      <div className="p-8 text-center text-muted-foreground border rounded-lg">
        Something went wrong loading this batch.
      </div>
    </PageContainer>
  );
}


