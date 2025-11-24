"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReviewQueueItem } from "./review-queue-item";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import type { ReviewQueueItem as ReviewQueueItemType, bulkUpdateTransactions } from "@/app/actions/review-queue";
import type { categories as categoriesSchema, businesses as businessesSchema } from "@/lib/db/schema";

type Category = typeof categoriesSchema.$inferSelect;
type Business = typeof businessesSchema.$inferSelect;

interface ReviewQueueListProps {
  initialItems: ReviewQueueItemType[];
  categories: Category[];
  businesses: Business[];
}

export function ReviewQueueList({
  initialItems,
  categories,
  businesses,
}: ReviewQueueListProps) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategoryId, setBulkCategoryId] = useState<string>("");
  const [bulkBusinessId, setBulkBusinessId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) {
      toast.error("Please select at least one transaction");
      return;
    }

    if (!bulkCategoryId) {
      toast.error("Please select a category");
      return;
    }

    startTransition(async () => {
      try {
        const { bulkUpdateTransactions } = await import("@/app/actions/review-queue");
        
        const updates = Array.from(selectedIds).map(id => {
          const item = items.find(i => i.id === id)!;
          return {
            id,
            type: item.type,
            categoryId: bulkCategoryId,
            businessId: bulkBusinessId,
          };
        });

        const result = await bulkUpdateTransactions(updates);

        if (result.success) {
          toast.success(`Updated ${selectedIds.size} transaction(s)`);
          setSelectedIds(new Set());
          setBulkCategoryId("");
          setBulkBusinessId(null);
          router.refresh();
        } else {
          toast.error(result.error || "Failed to update transactions");
        }
      } catch (error) {
        console.error("Bulk update error:", error);
        toast.error("Failed to update transactions");
      }
    });
  };

  const handleItemSaved = () => {
    // Refresh the list after an item is saved
    router.refresh();
  };

  // Group items by merchant for easier batch categorization
  const groupedByMerchant = items.reduce((acc, item) => {
    const merchant = item.merchantName || "Unknown";
    if (!acc[merchant]) {
      acc[merchant] = [];
    }
    acc[merchant].push(item);
    return acc;
  }, {} as Record<string, ReviewQueueItemType[]>);

  const merchantGroups = Object.entries(groupedByMerchant).sort((a, b) => 
    b[1].length - a[1].length // Sort by count descending
  );

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No transactions need your attention right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Review Queue
          </CardTitle>
          <CardDescription>
            {items.length} transaction{items.length !== 1 ? "s" : ""} need your attention
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
              <div className="flex-1 space-y-2 w-full md:w-auto">
                <p className="text-sm font-medium">
                  {selectedIds.size} selected
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Category</label>
                    <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {businesses.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Business (Optional)</label>
                      <Select 
                        value={bulkBusinessId || "personal"} 
                        onValueChange={(v) => setBulkBusinessId(v === "personal" ? null : v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          {businesses.map(business => (
                            <SelectItem key={business.id} value={business.id}>
                              {business.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleBulkUpdate} disabled={isPending || !bulkCategoryId} className="flex-1 md:flex-none">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isPending ? "Updating..." : "Apply to Selected"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedIds(new Set())} disabled={isPending}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compact Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleToggleAll}
                    ref={(el) => {
                      if (el && el instanceof HTMLInputElement) {
                        el.indeterminate = someSelected;
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Business</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <ReviewQueueItem
                  key={item.id}
                  item={item}
                  categories={categories}
                  businesses={businesses}
                  isSelected={selectedIds.has(item.id)}
                  onToggleSelect={() => handleToggleItem(item.id)}
                  onSaved={handleItemSaved}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Merchant Groups Info (Optional) */}
      {merchantGroups.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
            <CardDescription>
              Transactions grouped by merchant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {merchantGroups.slice(0, 5).map(([merchant, merchantItems]) => (
                <div key={merchant} className="flex justify-between text-sm">
                  <span className="truncate">{merchant}</span>
                  <span className="text-muted-foreground">
                    {merchantItems.length} transaction{merchantItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

