"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

interface CurrencySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

export function CurrencySelect({
  value,
  onValueChange,
  defaultValue,
  className,
}: CurrencySelectProps) {
  // Use value if provided (controlled), otherwise use defaultValue (uncontrolled)
  const selectValue = value !== undefined ? value : defaultValue;
  
  return (
    <Select value={selectValue} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{currency.code}</span>
              <span className="text-muted-foreground">
                {currency.symbol} - {currency.name}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
}

export function getCurrencyName(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.name || code;
}

