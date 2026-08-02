import { format, formatDistanceToNow, isPast } from "date-fns";
import type { AssignmentStatus, SubmissionStatus } from "./types";

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
  Draft: "bg-slate-100 text-slate-700 ring-slate-300",
  Published: "bg-emerald-50 text-emerald-700 ring-emerald-300",
};

export const submissionStatusStyles: Record<SubmissionStatus, string> = {
  Submitted: "bg-blue-50 text-blue-700 ring-blue-300",
  Late: "bg-amber-50 text-amber-700 ring-amber-300",
  NeedsRevision: "bg-orange-50 text-orange-700 ring-orange-300",
  Graded: "bg-emerald-50 text-emerald-700 ring-emerald-300",
};

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
