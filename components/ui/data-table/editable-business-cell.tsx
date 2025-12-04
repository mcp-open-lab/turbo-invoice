"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Business {
  id: string;
  name: string;
}

interface EditableBusinessCellProps {
  isEditing: boolean;
  value: string | null;
  displayValue?: string;
  onChange: (value: string | null) => void;
  businesses: Business[];
  className?: string;
  size?: "sm" | "default";
}

export function EditableBusinessCell({
  isEditing,
  value,
  displayValue,
  onChange,
  businesses,
  className,
  size = "default",
}: EditableBusinessCellProps) {
  if (businesses.length === 0 && !isEditing) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {displayValue || "Personal"}
      </span>
    );
  }

  if (isEditing && businesses.length > 0) {
    return (
      <Select
        value={value || "personal"}
        onValueChange={(v) => onChange(v === "personal" ? null : v)}
      >
        <SelectTrigger
          className={cn(
            size === "sm" ? "h-7 text-xs" : "h-8 text-xs",
            className
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="personal" className="text-xs">
            Personal
          </SelectItem>
          {businesses.map((b) => (
            <SelectItem key={b.id} value={b.id} className="text-xs">
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <span className={cn("text-xs text-muted-foreground truncate block", className)}>
      {displayValue || "Personal"}
    </span>
  );
}

