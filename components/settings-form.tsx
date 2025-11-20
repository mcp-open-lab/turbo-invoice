"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  saveUserSettings,
  type UsageType,
  type Country,
  type UserSettingsInput,
} from "@/app/actions/user-settings";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

const CANADIAN_PROVINCES = [
  "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
];

type SettingsFormProps = {
  initialSettings: {
    userId: string;
    usageType: string | null;
    country: string | null;
    province: string | null;
    currency: string | null;
    visibleFields: Record<string, boolean> | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

const DEFAULT_VISIBLE_FIELDS = {
  tipAmount: true,
  discountAmount: true,
  description: true,
  paymentMethod: true,
  businessPurpose: false,
  isBusinessExpense: false,
};

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [usageType, setUsageType] = useState<UsageType>(
    (initialSettings.usageType as UsageType) || "personal"
  );
  const [country, setCountry] = useState<Country>(
    (initialSettings.country as Country) || "US"
  );
  const [province, setProvince] = useState<string>(
    initialSettings.province || ""
  );
  const [currency, setCurrency] = useState<string>(
    initialSettings.currency || (initialSettings.country === "CA" ? "CAD" : "USD")
  );
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>(
    initialSettings.visibleFields || DEFAULT_VISIBLE_FIELDS
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!province && (country === "US" || country === "CA")) {
      toast.error("Please select your state/province");
      return;
    }

    startTransition(async () => {
      try {
        await saveUserSettings({
          usageType,
          country,
          province,
          currency,
          visibleFields,
        });
        toast.success("Settings saved!");
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast.error("Failed to save settings");
      }
    });
  };

  const toggleField = (fieldName: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="space-y-4">
          <div>
            <Label>Usage Type</Label>
            <Select
              value={usageType}
              onValueChange={(value) => setUsageType(value as UsageType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="mixed">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Country</Label>
            <Select
              value={country}
              onValueChange={(value) => {
                setCountry(value as Country);
                setProvince("");
                setCurrency(value === "CA" ? "CAD" : "USD");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {country && (
            <div>
              <Label>{country === "US" ? "State" : "Province"}</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(country === "US" ? US_STATES : CANADIAN_PROVINCES).map(
                    (code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="CAD">CAD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Field Visibility</h2>
        <p className="text-sm text-muted-foreground">
          Choose which fields you want to see and edit when viewing receipts
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="tip">Tip Amount</Label>
            <Switch
              id="tip"
              checked={visibleFields.tipAmount ?? true}
              onCheckedChange={() => toggleField("tipAmount")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="discount">Discount Amount</Label>
            <Switch
              id="discount"
              checked={visibleFields.discountAmount ?? true}
              onCheckedChange={() => toggleField("discountAmount")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Description</Label>
            <Switch
              id="description"
              checked={visibleFields.description ?? true}
              onCheckedChange={() => toggleField("description")}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="payment">Payment Method</Label>
            <Switch
              id="payment"
              checked={visibleFields.paymentMethod ?? true}
              onCheckedChange={() => toggleField("paymentMethod")}
            />
          </div>
          {(usageType === "business" || usageType === "mixed") && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="business-purpose">Business Purpose</Label>
                <Switch
                  id="business-purpose"
                  checked={visibleFields.businessPurpose ?? false}
                  onCheckedChange={() => toggleField("businessPurpose")}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="business-expense">Is Business Expense</Label>
                <Switch
                  id="business-expense"
                  checked={visibleFields.isBusinessExpense ?? false}
                  onCheckedChange={() => toggleField("isBusinessExpense")}
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}

