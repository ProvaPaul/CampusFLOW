"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useChartTheme, CHART_COLORS } from "./chart-theme";

export function SubmissionTrendChart({ data }: { data: Array<{ date: string; submissions: number }> }) {
  const theme = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="submissionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.indigo} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey="date" stroke={theme.axis} fontSize={11} tickLine={false} axisLine={false} tick={{ fill: theme.axis }} />
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
        <Area
          type="monotone"
          dataKey="submissions"
          stroke={CHART_COLORS.indigo}
          strokeWidth={2}
          fill="url(#submissionFill)"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
