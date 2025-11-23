"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { BusinessSplit } from "@/app/actions/analytics";

interface BusinessSplitBarProps {
  data: BusinessSplit[];
  currency?: string;
}

const chartConfig = {
  personal: {
    label: "Personal",
    color: "hsl(var(--chart-1))",
  },
  business: {
    label: "Business",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function BusinessSplitBar({
  data,
  currency = "USD",
}: BusinessSplitBarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format data for recharts
  const chartData = data.map((item) => ({
    name: item.type === "personal" ? "Personal" : item.businessName || "Business",
    value: item.totalSpent,
    fill: `var(--color-${item.type})`,
    percentage: item.percentage,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal vs Business</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name, item) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {formatCurrency(value as number)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.payload.percentage.toFixed(1)}% of total
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar dataKey="value" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

