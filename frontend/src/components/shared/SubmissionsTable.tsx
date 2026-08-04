"use client";

import type { SubmissionDto, SubmissionStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Spinner";
import { formatDate, submissionStatusStyles } from "@/lib/utils";

export interface SubmissionsTableProps {
  submissions: SubmissionDto[];
  /** Show the Student Email column. */
  showEmail?: boolean;
  /** Show the Teacher Feedback column. */
  showFeedback?: boolean;
  /** Show the Last Updated column. */
  showLastUpdated?: boolean;
  /**
   * If provided, non-Graded rows get an editable status <select> (calling this on change)
   * and Graded rows get a "Send back" action instead. Omit for a fully read-only table.
   */
  onStatusChange?: (submission: SubmissionDto, status: SubmissionStatus) => void;
  /** Status values offered in the editable dropdown (never include "Graded" — see SubmissionService.UpdateStatusAsync). */
  statusOptions?: SubmissionStatus[];
  /** Optional right-aligned actions cell per row, e.g. the teacher's "View & grade" button. */
  renderActions?: (submission: SubmissionDto) => React.ReactNode;
  emptyTitle?: string;
}

export function SubmissionsTable({
  submissions,
  showEmail = false,
  showFeedback = false,
  showLastUpdated = false,
  onStatusChange,
  statusOptions = ["Submitted", "Late", "NeedsRevision"],
  renderActions,
  emptyTitle = "No submissions yet",
}: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }

  const editable = !!onStatusChange;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {[
              "Student",
              showEmail && "Email",
              "Submitted",
              "Status",
              "Marks",
              showFeedback && "Feedback",
              showLastUpdated && "Last Updated",
              renderActions && "",
            ]
              .filter((h): h is string => typeof h === "string")
              .map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {h}
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {submissions.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{s.studentName}</td>
              {showEmail && <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{s.studentEmail}</td>}
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(s.submittedAt)}</td>
              <td className="px-4 py-3">
                {editable && s.status !== "Graded" ? (
                  <select
                    value={s.status}
                    onChange={(e) => onStatusChange?.(s, e.target.value as SubmissionStatus)}
                    className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${submissionStatusStyles[s.status]}`}
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : editable && s.status === "Graded" ? (
                  <div className="flex items-center gap-2">
                    <Badge className={submissionStatusStyles[s.status]}>{s.status}</Badge>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Send this submission back for revision? This clears its marks and feedback.")) {
                          onStatusChange?.(s, "NeedsRevision");
                        }
                      }}
                      className="text-xs text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Send back
                    </button>
                  </div>
                ) : (
                  <Badge className={submissionStatusStyles[s.status]}>{s.status}</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                {s.marks !== null ? `${s.marks}/${s.maxMarks}` : "—"}
              </td>
              {showFeedback && (
                <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600 dark:text-slate-400" title={s.feedback ?? undefined}>
                  {s.feedback ?? "—"}
                </td>
              )}
              {showLastUpdated && (
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  {s.updatedAt ? formatDate(s.updatedAt) : "—"}
                </td>
              )}
              {renderActions && <td className="px-4 py-3 text-right">{renderActions(s)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
