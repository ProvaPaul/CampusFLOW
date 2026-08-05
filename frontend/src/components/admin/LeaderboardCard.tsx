import { Avatar } from "@/components/ui/Avatar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/Spinner";
import type { LeaderboardEntry } from "@/lib/admin-analytics";
import { cn } from "@/lib/utils";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export function LeaderboardCard({ title, description, entries }: { title: string; description: string; entries: LeaderboardEntry[] }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {entries.length === 0 ? (
          <EmptyState title="Not enough data yet" description="This leaderboard will populate as activity comes in." />
        ) : (
          <ol className="space-y-2">
            {entries.map((entry, index) => (
              <li key={entry.id} className="flex items-center gap-3">
                <span className={cn("w-6 shrink-0 text-center text-sm", index < 3 ? "text-lg" : "font-semibold text-slate-400 dark:text-slate-500")}>
                  {RANK_MEDALS[index] ?? index + 1}
                </span>
                <Avatar name={entry.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{entry.name}</span>
                  {entry.secondaryLabel && <span className="block text-xs text-slate-500 dark:text-slate-400">{entry.secondaryLabel}</span>}
                </span>
                <span className="shrink-0 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {entry.metricValue}
                  {entry.metricSuffix}
                </span>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}
