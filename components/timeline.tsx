"use client";

import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X, ChevronRight, Loader2 } from "lucide-react";
import { groupItemsByMonth } from "@/lib/utils/timeline";
import { RECEIPT_CATEGORIES, RECEIPT_STATUSES } from "@/lib/consts";
import Link from "next/link";
import type { TimelineItem, TimelineFilters } from "@/lib/api/timeline";
import { fetchTimelineItems } from "@/app/actions/timeline";

type UserSettings = {
  visibleFields?: Record<string, boolean> | null;
  requiredFields?: Record<string, boolean> | null;
  country?: string | null;
  usageType?: string | null;
  defaultValues?: {
    isBusinessExpense?: boolean | null;
    businessPurpose?: string | null;
    paymentMethod?: "cash" | "card" | "check" | "other" | null;
  } | null;
};

type TimelineProps = {
  initialItems: TimelineItem[];
  userSettings?: UserSettings | null;
};

const categories = RECEIPT_CATEGORIES;
const statuses = RECEIPT_STATUSES;

export function Timeline({ initialItems, userSettings }: TimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>(initialItems);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Assume true initially if full page, but we can be smarter
  const [isPending, startTransition] = useTransition();
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");

  // Group items for display
  const filteredGroups = useMemo(() => groupItemsByMonth(items), [items]);

  const handleLoadMore = () => {
    startTransition(async () => {
      const nextPage = page + 1;
      const filters: TimelineFilters = {
        search: search || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: documentTypeFilter !== "all" ? documentTypeFilter : undefined,
      };
      
      const result = await fetchTimelineItems(nextPage, 20, filters);
      
      if (result.items.length > 0) {
        setItems((prev) => [...prev, ...result.items]);
        setPage(nextPage);
      }
      setHasMore(result.hasMore);
    });
  };

  const applyFilters = () => {
    startTransition(async () => {
      const filters: TimelineFilters = {
        search: search || undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        type: documentTypeFilter !== "all" ? documentTypeFilter : undefined,
      };

      // Reset to page 1
      const result = await fetchTimelineItems(1, 20, filters);
      setItems(result.items);
      setHasMore(result.hasMore);
      setPage(1);
      setFilterOpen(false);
    });
  };

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    // Could add debounce here, but for now let's require "Enter" or blur or just effect?
    // Ideally search triggers filter apply.
  };

  // Trigger search on Enter
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const hasActiveFilters = 
    categoryFilter !== "all" || 
    statusFilter !== "all" || 
    documentTypeFilter !== "all" ||
    search !== "";

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setDocumentTypeFilter("all");
    // We need to trigger fetch with empty filters
    // Ideally call applyFilters() but state updates are async.
    // So we call fetch directly with empty object
    startTransition(async () => {
      const result = await fetchTimelineItems(1, 20, {});
      setItems(result.items);
      setHasMore(result.hasMore);
      setPage(1);
      setFilterOpen(false);
    });
  };

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="mb-4 flex gap-2 items-center sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search items... (Press Enter)"
            className="w-full pr-10"
          />
        </div>
        
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="h-[70vh] rounded-t-[20px] flex flex-col"
          >
            <SheetHeader className="flex-shrink-0">
              <SheetTitle>Filter Timeline</SheetTitle>
              <SheetDescription className="sr-only">
                Filter your timeline items
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6 flex-1 overflow-y-auto">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Document Type
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={documentTypeFilter}
                  onChange={(e) => setDocumentTypeFilter(e.target.value)}
                >
                  <option value="all">All types</option>
                  <option value="receipt">Receipts</option>
                  <option value="transaction">Bank Statements</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Category
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statuses.map((status: string) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
                <Button className="flex-1" onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="mb-4 flex flex-wrap gap-2">
          {/* Badges would go here, but for simplicity skipping detailed badges logic since reset covers it */}
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs">
            Clear all filters <X className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Timeline View */}
      <div className="space-y-8 pb-24">
        {items.length === 0 && !isPending && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No items match your filters.</p>
            <Button variant="link" onClick={resetFilters}>
              Clear all filters
            </Button>
          </div>
        )}

        {filteredGroups.map((group) => (
          <div key={group.monthKey} className="relative">
            <h3 className="text-sm font-medium text-muted-foreground mb-4 sticky top-14 bg-background/95 backdrop-blur py-2 z-0 px-1">
              {group.monthLabel}
            </h3>
            <div className="space-y-3 pl-4 border-l-2 border-muted ml-2">
              {group.items.map((item) => {
                const href =
                  item.type === "transaction"
                    ? `/app/transactions/${item.id}`
                    : `/app/receipts/${item.id}`;

                return (
                  <Link key={item.id} href={href}>
                    <Card className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors border-none shadow-sm relative -ml-[21px] group">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background"></div>
                      <div className="flex-1 ml-4">
                        <p className="font-semibold text-sm md:text-base">
                          {item.merchantName || "Unknown Vendor"}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>
                            {item.date
                              ? new Date(item.date).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  weekday: "short",
                                })
                              : "No Date"}
                          </span>
                          {item.category && (
                            <>
                              <span>•</span>
                              <span>{item.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm md:text-base">
                          {item.type === "receipt" ? "-" : ""}
                          {item.currency || "$"}
                          {item.amount}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            item.status === "approved" || item.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status === "needs_review" ? "Review" : "Done"}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Load More / Loading State */}
        <div className="flex justify-center py-4">
          {isPending ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : hasMore ? (
            <Button variant="outline" onClick={handleLoadMore}>
              Load More
            </Button>
          ) : items.length > 0 ? (
            <p className="text-xs text-muted-foreground">End of timeline</p>
          ) : null}
        </div>
      </div>
    </>
  );
}
