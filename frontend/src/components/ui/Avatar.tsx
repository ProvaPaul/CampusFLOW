import { cn } from "@/lib/utils";

const palette = [
  "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({ name, size = "md", className }: { name: string; size?: keyof typeof sizeClasses; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        sizeClasses[size],
        colorFor(name || "?"),
        className
      )}
      aria-hidden="true"
    >
      {name ? initials(name) : "?"}
    </span>
  );
}
