"use client";

import { useState, useCallback } from "react";

interface EditState {
  categoryId: string;
  businessId: string | null;
  applyToFuture: boolean;
}

interface UseInlineEditOptions {
  onSave?: (id: string, state: EditState) => Promise<void>;
}

interface UseInlineEditReturn {
  editingId: string | null;
  editState: EditState;
  startEdit: (id: string, initialState: EditState) => void;
  cancelEdit: () => void;
  isEditing: (id: string) => boolean;
  setCategoryId: (categoryId: string) => void;
  setBusinessId: (businessId: string | null) => void;
  setApplyToFuture: (applyToFuture: boolean) => void;
  saveEdit: () => Promise<void>;
  isPending: boolean;
}

export function useInlineEdit({
  onSave,
}: UseInlineEditOptions = {}): UseInlineEditReturn {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({
    categoryId: "",
    businessId: null,
    applyToFuture: true,
  });
  const [isPending, setIsPending] = useState(false);

  const startEdit = useCallback((id: string, initialState: EditState) => {
    setEditingId(id);
    setEditState(initialState);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditState({ categoryId: "", businessId: null, applyToFuture: true });
  }, []);

  const isEditing = useCallback(
    (id: string) => editingId === id,
    [editingId]
  );

  const setCategoryId = useCallback((categoryId: string) => {
    setEditState((prev) => ({ ...prev, categoryId }));
  }, []);

  const setBusinessId = useCallback((businessId: string | null) => {
    setEditState((prev) => ({ ...prev, businessId }));
  }, []);

  const setApplyToFuture = useCallback((applyToFuture: boolean) => {
    setEditState((prev) => ({ ...prev, applyToFuture }));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingId || !onSave) return;

    setIsPending(true);
    try {
      await onSave(editingId, editState);
      setEditingId(null);
      setEditState({ categoryId: "", businessId: null, applyToFuture: true });
    } finally {
      setIsPending(false);
    }
  }, [editingId, editState, onSave]);

  return {
    editingId,
    editState,
    startEdit,
    cancelEdit,
    isEditing,
    setCategoryId,
    setBusinessId,
    setApplyToFuture,
    saveEdit,
    isPending,
  };
}

