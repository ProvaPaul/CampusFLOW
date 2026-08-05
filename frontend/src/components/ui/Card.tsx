import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  /** Adds a subtle lift + border highlight on hover — for clickable/navigable cards. */
  interactive?: boolean;
}

export function Card({ className, children, interactive }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900",
        interactive && "hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md dark:hover:border-slate-700",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
