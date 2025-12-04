"use client";

import { CategoryCombobox, CategoryComboboxDisplay } from "@/components/ui/category-combobox";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  transactionType: string;
}

interface EditableCategoryCellProps {
  isEditing: boolean;
  value: string;
  displayValue?: string;
  onChange: (value: string) => void;
  categories: Category[];
  transactionType?: "income" | "expense";
  className?: string;
  size?: "sm" | "default";
}

export function EditableCategoryCell({
  isEditing,
  value,
  displayValue,
  onChange,
  categories,
  transactionType,
  className,
  size = "default",
}: EditableCategoryCellProps) {
  if (isEditing) {
    return (
      <CategoryCombobox
        value={value}
        displayValue={displayValue}
        onChange={onChange}
        categories={categories}
        transactionType={transactionType}
        placeholder="Select category..."
        className={className}
        size={size}
      />
    );
  }

  return (
    <CategoryComboboxDisplay displayValue={displayValue} className={className} />
  );
}

