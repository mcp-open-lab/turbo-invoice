"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const filteredCategories = transactionType
    ? categories.filter((cat) => cat.transactionType === transactionType)
    : categories;

  if (isEditing) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            size === "sm" ? "h-7 text-xs" : "h-8 text-xs",
            className
          )}
        >
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          {filteredCategories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id} className="text-xs">
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {displayValue || "Uncategorized"}
    </Badge>
  );
}

