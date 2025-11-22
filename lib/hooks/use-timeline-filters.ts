"use client";

import { useMemo } from "react";
import type { receipts } from "@/lib/db/schema";
import { groupItemsByMonth } from "@/lib/utils/timeline";
import { useTimelineStore } from "@/lib/stores/timeline-store";

type Receipt = typeof receipts.$inferSelect;

export function useTimelineFilters(receipts: Receipt[]) {
  const {
    search,
    categoryFilter,
    statusFilter,
    documentTypeFilter,
    sortBy,
    setSearch,
    setCategoryFilter,
    setStatusFilter,
    setDocumentTypeFilter,
    setSortBy,
    resetFilters,
  } = useTimelineStore();

  const availableCategories = useMemo(() => {
    const cats = new Set(
      receipts.map((r) => r.category).filter((c): c is string => Boolean(c))
    );
    return Array.from(cats);
  }, [receipts]);

  const availableStatuses = useMemo(() => {
    const stats = new Set(
      receipts.map((r) => r.status).filter((s): s is string => Boolean(s))
    );
    return Array.from(stats);
  }, [receipts]);

  const availableDocumentTypes = useMemo(() => {
    const types = new Set(
      receipts.map((r) => r.type).filter((t): t is string => Boolean(t))
    );
    return Array.from(types);
  }, [receipts]);

  // Group and sort logic
  const timelineGroups = useMemo(() => {
    return groupItemsByMonth(receipts, sortBy);
  }, [receipts, sortBy]);

  // Filter logic
  const filteredGroups = useMemo(() => {
    return timelineGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          const normalizedSearch = search.trim().toLowerCase();
          const matchesSearch = normalizedSearch
            ? (item.merchantName || "")
                .toLowerCase()
                .includes(normalizedSearch) ||
              (item.fileName || "").toLowerCase().includes(normalizedSearch)
            : true;

          const matchesCategory =
            categoryFilter === "all" || item.category === categoryFilter;

          const matchesStatus =
            statusFilter === "all" || item.status === statusFilter;

          const matchesDocumentType =
            documentTypeFilter === "all" || item.type === documentTypeFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus &&
            matchesDocumentType
          );
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [
    timelineGroups,
    search,
    categoryFilter,
    statusFilter,
    documentTypeFilter,
  ]);

  const totalFilteredCount = filteredGroups.reduce(
    (sum, group) => sum + group.items.length,
    0
  );

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (documentTypeFilter !== "all" ? 1 : 0);

  return {
    search,
    setSearch,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    documentTypeFilter,
    setDocumentTypeFilter,
    sortBy,
    setSortBy,
    resetFilters,
    filteredGroups,
    availableCategories,
    availableStatuses,
    availableDocumentTypes,
    totalFilteredCount,
    activeFilterCount,
  };
}
