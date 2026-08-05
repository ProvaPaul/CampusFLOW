import { format, formatDistanceToNow, isPast } from "date-fns";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AssignmentStatus, SubmissionStatus } from "./types";
import type { EntityStatus } from "./admin-analytics";

export function formatDate(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy, h:mm a");
}

export function formatRelative(value: string | Date): string {
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

export function isDeadlinePassed(deadline: string | Date): boolean {
  return isPast(new Date(deadline));
}

export const assignmentStatusStyles: Record<AssignmentStatus, string> = {
  Draft: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  Published: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-800",
};

export const submissionStatusStyles: Record<SubmissionStatus, string> = {
  Submitted: "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-800",
  Late: "bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-800",
  NeedsRevision: "bg-orange-50 text-orange-700 ring-orange-300 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-800",
  Graded: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-800",
};

export const entityStatusStyles: Record<EntityStatus, string> = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-800",
  "Needs Teacher": "bg-amber-50 text-amber-700 ring-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-800",
  "No Assignments": "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
  "Setting Up": "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-800",
  Empty: "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
};

/** shadcn/ui-style class combiner: clsx for conditional classes, tailwind-merge to resolve conflicts. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** @deprecated use `cn` — kept as an alias so existing call sites keep working. */
export const cx = cn;
