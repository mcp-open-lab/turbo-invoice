import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortBy } from "@/lib/utils/timeline";

interface TimelineState {
  search: string;
  categoryFilter: string;
  statusFilter: string;
  documentTypeFilter: string;
  sortBy: SortBy;
  setSearch: (search: string) => void;
  setCategoryFilter: (category: string) => void;
  setStatusFilter: (status: string) => void;
  setDocumentTypeFilter: (documentType: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  resetFilters: () => void;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      search: "",
      categoryFilter: "all",
      statusFilter: "all",
      documentTypeFilter: "all",
      sortBy: "receipt_date",
      setSearch: (search) => set({ search }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setDocumentTypeFilter: (documentTypeFilter) => set({ documentTypeFilter }),
      setSortBy: (sortBy) => set({ sortBy }),
      resetFilters: () =>
        set({
          search: "",
          categoryFilter: "all",
          statusFilter: "all",
          documentTypeFilter: "all",
        }),
    }),
    {
      name: "timeline-storage",
      partialize: (state) => ({
        // Persist filters and sort preferences
        categoryFilter: state.categoryFilter,
        statusFilter: state.statusFilter,
        documentTypeFilter: state.documentTypeFilter,
        sortBy: state.sortBy,
        // Don't persist search query as it's usually transient
      }),
    }
  )
);
