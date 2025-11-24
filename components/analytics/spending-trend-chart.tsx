"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { SpendingTrend } from "@/app/actions/analytics";
import { ExpandableChartCard } from "./expandable-chart-card";

interface SpendingTrendChartProps {
  data: SpendingTrend[];
  currency?: string;
}

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expense: {
    label: "Expense",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SpendingTrendChart({
  data,
  currency = "USD",
}: SpendingTrendChartProps) {
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  };

  const chartData = data.map((item) => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  return (
    <ExpandableChartCard title="Spending Trends">
      {(isExpanded) => (
        <ChartContainer
          config={chartConfig}
          className={isExpanded ? "h-[400px]" : "h-[200px]"}
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: isExpanded ? 12 : 0,
              right: 12,
              top: 12,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            {isExpanded && (
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
            )}
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="income"
              type="natural"
              fill="var(--color-income)"
              fillOpacity={0.4}
              stroke="var(--color-income)"
              stackId="a"
            />
            <Area
              dataKey="expense"
              type="natural"
              fill="var(--color-expense)"
              fillOpacity={0.4}
              stroke="var(--color-expense)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      )}
    </ExpandableChartCard>
  );
}

