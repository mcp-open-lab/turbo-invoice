"use client";

import { useState, useCallback, useMemo } from "react";

interface UseRowSelectionOptions<T extends { id: string }> {
  items: T[];
  initialSelected?: Set<string>;
}

interface UseRowSelectionReturn {
  selectedIds: Set<string>;
  toggleItem: (id: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  selectItems: (ids: string[]) => void;
  allSelected: boolean;
  someSelected: boolean;
  selectedCount: number;
}

export function useRowSelection<T extends { id: string }>({
  items,
  initialSelected = new Set(),
}: UseRowSelectionOptions<T>): UseRowSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelected);

  const allSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  const someSelected = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  );

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === items.length) {
        return new Set();
      }
      return new Set(items.map((item) => item.id));
    });
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectItems = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  return {
    selectedIds,
    toggleItem,
    toggleAll,
    clearSelection,
    selectItems,
    allSelected,
    someSelected,
    selectedCount: selectedIds.size,
  };
}

