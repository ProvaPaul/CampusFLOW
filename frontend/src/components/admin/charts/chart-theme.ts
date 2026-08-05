"use client";

import { useTheme } from "@/lib/theme-context";

/** Shared recharts theming — recharts doesn't read Tailwind's dark mode automatically. */
export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    isDark,
    grid: isDark ? "#1e293b" : "#e2e8f0",
    axis: isDark ? "#64748b" : "#94a3b8",
    tooltipBg: isDark ? "#0f172a" : "#ffffff",
    tooltipBorder: isDark ? "#1e293b" : "#e2e8f0",
    tooltipText: isDark ? "#e2e8f0" : "#0f172a",
  };
}

export const CHART_COLORS = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  slate: "#94a3b8",
  blue: "#3b82f6",
  purple: "#a855f7",
  rose: "#f43f5e",
};
