"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useChartTheme } from "./chart-theme";

export interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  colors: string[];
}

export function DonutChart({ data, colors }: DonutChartProps) {
  const theme = useChartTheme();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-slate-400 dark:text-slate-500">No data yet</div>;
  }

  return (
    <div className="flex h-full items-center gap-4">
      <div className="h-full w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={2} strokeWidth={0}>
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: theme.tooltipBg, border: `1px solid ${theme.tooltipBorder}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: theme.tooltipText }}
              itemStyle={{ color: theme.tooltipText }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
