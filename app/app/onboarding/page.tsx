"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { saveUserSettings, type UsageType, type Country } from "@/app/actions/user-settings";

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

export default function OnboardingPage() {
  const router = useRouter();
  const [usageType, setUsageType] = useState<UsageType>("personal");
  const [country, setCountry] = useState<Country>("US");
  const [province, setProvince] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
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
          currency: country === "CA" ? "CAD" : "USD",
        });
        toast.success("Settings saved!");
        router.push("/app");
        router.refresh();
      } catch (error) {
        console.error("Failed to save settings:", error);
        toast.error("Failed to save settings");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-white">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to Turbo Invoice</h1>
          <p className="text-muted-foreground">
            Let's personalize your experience
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              How do you use Turbo Invoice?
            </label>
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
            <label className="text-sm font-medium mb-2 block">
              Where are you located?
            </label>
            <Select
              value={country}
              onValueChange={(value) => {
                setCountry(value as Country);
                setProvince("");
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
              <label className="text-sm font-medium mb-2 block">
                {country === "US" ? "State" : "Province"}
              </label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${country === "US" ? "state" : "province"}`} />
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

          <Button
            onClick={handleSubmit}
            disabled={isPending || !province}
            className="w-full"
          >
            {isPending ? "Saving..." : "Get Started"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

