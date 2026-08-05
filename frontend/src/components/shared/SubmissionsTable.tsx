"use client";

import type { SubmissionDto, SubmissionStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
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
  const editable = !!onStatusChange;

  const columns: DataTableColumn<SubmissionDto>[] = [
    {
      key: "student",
      header: "Student",
      sortAccessor: (s) => s.studentName,
      render: (s) => <span className="font-medium text-slate-900 dark:text-slate-100">{s.studentName}</span>,
    },
    ...(showEmail
      ? [
          {
            key: "email",
            header: "Email",
            render: (s: SubmissionDto) => <span className="text-slate-600 dark:text-slate-400">{s.studentEmail}</span>,
          } satisfies DataTableColumn<SubmissionDto>,
        ]
      : []),
    {
      key: "submitted",
      header: "Submitted",
      sortAccessor: (s) => s.submittedAt,
      render: (s) => <span className="text-slate-600 dark:text-slate-400">{formatDate(s.submittedAt)}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (s) =>
        editable && s.status !== "Graded" ? (
          <select
            value={s.status}
            onChange={(e) => onStatusChange?.(s, e.target.value as SubmissionStatus)}
            onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => {
                e.stopPropagation();
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
        ),
    },
    {
      key: "marks",
      header: "Marks",
      sortAccessor: (s) => s.marks ?? -1,
      render: (s) => <span className="text-slate-600 dark:text-slate-400">{s.marks !== null ? `${s.marks}/${s.maxMarks}` : "—"}</span>,
    },
    ...(showFeedback
      ? [
          {
            key: "feedback",
            header: "Feedback",
            render: (s: SubmissionDto) => (
              <span className="line-clamp-1 max-w-xs text-slate-600 dark:text-slate-400" title={s.feedback ?? undefined}>
                {s.feedback ?? "—"}
              </span>
            ),
          } satisfies DataTableColumn<SubmissionDto>,
        ]
      : []),
    ...(showLastUpdated
      ? [
          {
            key: "updatedAt",
            header: "Last Updated",
            sortAccessor: (s: SubmissionDto) => s.updatedAt ?? "",
            render: (s: SubmissionDto) => <span className="text-slate-600 dark:text-slate-400">{s.updatedAt ? formatDate(s.updatedAt) : "—"}</span>,
          } satisfies DataTableColumn<SubmissionDto>,
        ]
      : []),
    ...(renderActions
      ? [
          {
            key: "actions",
            header: "",
            align: "right" as const,
            hideOnMobile: true,
            render: renderActions,
          } satisfies DataTableColumn<SubmissionDto>,
        ]
      : []),
  ];

  return (
    <DataTable
      data={submissions}
      columns={columns}
      keyExtractor={(s) => s.id}
      emptyTitle={emptyTitle}
      mobileBadge={(s) => (s.status !== "Graded" ? null : <Badge className={submissionStatusStyles[s.status]}>{s.status}</Badge>)}
    />
  );
}
