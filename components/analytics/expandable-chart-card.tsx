"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpandableChartCardProps {
  title: string;
  children: (isExpanded: boolean) => React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export function ExpandableChartCard({
  title,
  children,
  defaultExpanded = false,
  className,
}: ExpandableChartCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn(className, isExpanded && "col-span-full")}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-8 w-8"
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className={cn(isExpanded ? "pb-6" : "pb-2")}>
        {children(isExpanded)}
      </CardContent>
    </Card>
  );
}

