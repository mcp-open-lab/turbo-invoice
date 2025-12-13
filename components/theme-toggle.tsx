"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHydrated } from "@/lib/hooks/use-hydrated";

/**
 * ThemeToggle - Dark mode toggle button
 * 
 * Follows shadcn/ui patterns:
 * - Uses next-themes for theme management
 * - Supports system, light, and dark modes
 * - Includes tooltip for accessibility
 * - Matches shadcn button styling
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 md:h-9 md:w-9"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-4 w-4 transition-all" />
            ) : (
              <Moon className="h-4 w-4 transition-all" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDark ? "Switch to light mode" : "Switch to dark mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

