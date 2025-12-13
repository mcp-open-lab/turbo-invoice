"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportUploadZone } from "@/components/import/import-upload-zone";
import { BatchesList } from "@/components/import/batches-list";
import { RecentBatches } from "@/components/import/recent-batches";
import type { ImportBatch } from "@/lib/import/batch-types";

interface ImportTabsProps {
  initialBatches: ImportBatch[];
  initialCursor: string | null;
  initialHasMore: boolean;
  initialTab?: string;
}

export function ImportTabs({
  initialBatches,
  initialCursor,
  initialHasMore,
  initialTab = "import",
  defaultCurrency = "USD",
}: ImportTabsProps & { defaultCurrency?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => {
    const urlTab = searchParams.get("tab");
    return urlTab || initialTab;
  }, [initialTab, searchParams]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "import") {
      params.delete("tab");
    } else {
      params.set("tab", value);
    }
    router.push(`/app/import?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList>
        <TabsTrigger value="import">Import</TabsTrigger>
        <TabsTrigger value="jobs">History</TabsTrigger>
      </TabsList>
      <TabsContent value="import" className="mt-6 space-y-8">
        <ImportUploadZone defaultCurrency={defaultCurrency} />

        {initialBatches.length > 0 && (
          <RecentBatches
            batches={initialBatches}
            onViewAll={() => handleTabChange("jobs")}
          />
        )}
      </TabsContent>
      <TabsContent value="jobs" className="mt-6">
        <BatchesList
          initialBatches={initialBatches}
          initialCursor={initialCursor}
          initialHasMore={initialHasMore}
        />
      </TabsContent>
    </Tabs>
  );
}
