"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, CHART_COLORS } from "./chart-theme";

export function ClassActivityChart({ data }: { data: Array<{ name: string; assignments: number; submissionRate: number }> }) {
  const theme = useChartTheme();

  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">No classes yet</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis
          dataKey="name"
          stroke={theme.axis}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          interval={0}
          tick={{ fill: theme.axis }}
          tickFormatter={(value: string) => (value.length > 12 ? `${value.slice(0, 12)}…` : value)}
        />
        <YAxis
          stroke={theme.axis}
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={32}
          tick={{ fill: theme.axis }}
        />
        <Tooltip
          contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: theme.tooltipText }}
          itemStyle={{ color: theme.tooltipText }}
        />
        <Bar dataKey="assignments" name="Active assignments" fill={CHART_COLORS.indigo} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
