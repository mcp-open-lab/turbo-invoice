"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  transactionType: string;
  type?: string;
}

interface CategoryComboboxProps {
  value?: string;
  displayValue?: string;
  onChange: (value: string) => void;
  categories: Category[];
  transactionType?: "income" | "expense";
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
  disabled?: boolean;
}

export function CategoryCombobox({
  value,
  displayValue,
  onChange,
  categories,
  transactionType,
  placeholder = "Select category...",
  className,
  size = "default",
  disabled = false,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const filteredCategories = React.useMemo(() => {
    if (transactionType) {
      return categories.filter((cat) => cat.transactionType === transactionType);
    }
    return categories;
  }, [categories, transactionType]);

  const selectedCategory = React.useMemo(() => {
    return filteredCategories.find((cat) => cat.id === value);
  }, [filteredCategories, value]);

  const buttonSize = size === "sm" ? "h-7 text-xs" : "h-8 text-xs";
  const contentSize = size === "sm" ? "w-[200px] p-0" : "w-[250px] p-0";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            buttonSize,
            "justify-between font-normal",
            !selectedCategory && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedCategory ? (
            <span className="truncate">{selectedCategory.name}</span>
          ) : displayValue ? (
            <span className="truncate">{displayValue}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={contentSize} align="start">
        <Command>
          <CommandInput placeholder="Search categories..." className="h-9" />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {filteredCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onChange(category.id);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{category.name}</span>
                  {category.type === "user" && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      (Custom)
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface CategoryComboboxDisplayProps {
  displayValue?: string;
  className?: string;
}

export function CategoryComboboxDisplay({
  displayValue,
  className,
}: CategoryComboboxDisplayProps) {
  return (
    <Badge variant="outline" className={cn("text-xs", className)}>
      {displayValue || "Uncategorized"}
    </Badge>
  );
}

