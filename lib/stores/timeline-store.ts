import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SortBy } from "@/lib/utils/timeline";

interface TimelineState {
  search: string;
  categoryFilter: string;
  statusFilter: string;
  documentTypeFilter: string;
  businessFilter: string;
  transactionTypeFilter: string;
  merchantFilter: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  amountMin: string;
  amountMax: string;
  sortBy: SortBy;
  setSearch: (search: string) => void;
  setCategoryFilter: (category: string) => void;
  setStatusFilter: (status: string) => void;
  setDocumentTypeFilter: (documentType: string) => void;
  setBusinessFilter: (business: string) => void;
  setTransactionTypeFilter: (type: string) => void;
  setMerchantFilter: (merchant: string) => void;
  setDateRange: (from: Date | null, to: Date | null) => void;
  setAmountRange: (min: string, max: string) => void;
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
      businessFilter: "all",
      transactionTypeFilter: "all",
      merchantFilter: "all",
      dateFrom: null,
      dateTo: null,
      amountMin: "",
      amountMax: "",
      sortBy: "receipt_date",
      setSearch: (search) => set({ search }),
      setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setDocumentTypeFilter: (documentTypeFilter) => set({ documentTypeFilter }),
      setBusinessFilter: (businessFilter) => set({ businessFilter }),
      setTransactionTypeFilter: (transactionTypeFilter) => set({ transactionTypeFilter }),
      setMerchantFilter: (merchantFilter) => set({ merchantFilter }),
      setDateRange: (dateFrom, dateTo) => set({ dateFrom, dateTo }),
      setAmountRange: (amountMin, amountMax) => set({ amountMin, amountMax }),
      setSortBy: (sortBy) => set({ sortBy }),
      resetFilters: () =>
        set({
          search: "",
          categoryFilter: "all",
          statusFilter: "all",
          documentTypeFilter: "all",
          businessFilter: "all",
          transactionTypeFilter: "all",
          merchantFilter: "all",
          dateFrom: null,
          dateTo: null,
          amountMin: "",
          amountMax: "",
        }),
    }),
    {
      name: "timeline-storage",
      skipHydration: true, // Prevent hydration mismatch
      partialize: (state) => ({
        // Persist filters and sort preferences
        categoryFilter: state.categoryFilter,
        statusFilter: state.statusFilter,
        documentTypeFilter: state.documentTypeFilter,
        businessFilter: state.businessFilter,
        transactionTypeFilter: state.transactionTypeFilter,
        sortBy: state.sortBy,
        // Don't persist search, merchant, date range, or amount range (transient)
      }),
    }
  )
);
