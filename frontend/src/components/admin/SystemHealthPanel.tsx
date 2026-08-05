import { Database, LogIn, UserCheck, UserX } from "lucide-react";
import type { SystemHealth } from "@/lib/admin-analytics";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { formatDistanceToNow } from "date-fns";

function StatRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export function SystemHealthPanel({ data }: { data: SystemHealth }) {
  return (
    <Card>
      <CardHeader title="⚙️ System Health" description="Platform-level status, derived from live data — no synthetic metrics." />
      <CardBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatRow icon={Database} label="Records managed" value={data.totalRecords.toLocaleString()} />
          <StatRow icon={UserCheck} label="Active accounts" value={data.activeUserCount} />
          <StatRow icon={UserX} label="Deactivated accounts" value={data.inactiveUserCount} />
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <LogIn className="h-3.5 w-3.5" /> Recent logins
          </p>
          {data.recentLogins.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No login activity recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentLogins.map(({ user, lastLoginAt }) => (
                <li key={user.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Avatar name={user.fullName} size="sm" />
                    <span className="truncate text-slate-700 dark:text-slate-300">{user.fullName}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDistanceToNow(lastLoginAt, { addSuffix: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
