import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortBy } from "@/lib/utils/timeline";

interface TimelineState {
  search: string;
  categoryFilter: string;
  statusFilter: string;
  sortBy: SortBy;
  setSearch: (search: string) => void;
  setCategoryFilter: (category: string) => void;
  setStatusFilter: (status: string) => void;
  setSortBy: (sortBy: SortBy) => void;
  resetFilters: () => void;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set) => ({
      search: "",
      categoryFilter: "all",
      statusFilter: "all",
      sortBy: "receipt_date",
      setSearch: (search) => set({ search }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setSortBy: (sortBy) => set({ sortBy }),
      resetFilters: () =>
        set({
          search: "",
          categoryFilter: "all",
          statusFilter: "all",
        }),
    }),
    {
      name: "timeline-storage",
      partialize: (state) => ({
        // Persist filters and sort preferences
        categoryFilter: state.categoryFilter,
        statusFilter: state.statusFilter,
        sortBy: state.sortBy,
        // Don't persist search query as it's usually transient
      }),
    }
  )
);
