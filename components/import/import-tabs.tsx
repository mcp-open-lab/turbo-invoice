"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportUploadZone } from "@/components/import/import-upload-zone";
import { BatchesList } from "@/components/import/batches-list";
import type { ImportBatch } from "@/lib/import/batch-types";

interface ImportTabsProps {
  initialBatches: ImportBatch[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

export function ImportTabs({
  initialBatches,
  initialCursor,
  initialHasMore,
}: ImportTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "import";

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
        <TabsTrigger value="jobs">View Jobs</TabsTrigger>
      </TabsList>
      <TabsContent value="import" className="mt-6">
        <ImportUploadZone />
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

