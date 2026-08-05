import { Inbox, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "./Button";

export function Spinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <Icon className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
      {description && <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && (
        <Button size="sm" variant="secondary" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
