import type { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { cx } from "@/lib/utils";

type Tone = "default" | "warning" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  default: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  danger: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={cx("shrink-0 rounded-lg p-2.5", toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
          {hint && <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
      </CardBody>
    </Card>
  );
}

export function StatCardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", className)}>{children}</div>;
}
