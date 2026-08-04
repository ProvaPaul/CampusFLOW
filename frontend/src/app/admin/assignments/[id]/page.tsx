"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { assignmentsApi, submissionsApi } from "@/lib/api";
import type { AssignmentDto, SubmissionDto, SubmissionStatus } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SubmissionsTable } from "@/components/shared/SubmissionsTable";
import { assignmentStatusStyles, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
const statusFilterOptions: Array<SubmissionStatus | "All"> = ["All", "Submitted", "Late", "NeedsRevision", "Graded"];

export default function AdminAssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "All">("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([assignmentsApi.getById(params.id), submissionsApi.getByAssignment(params.id)]).then(([a, subs]) => {
      setAssignment(a);
      setSubmissions(subs);
    });
  }, [params.id]);

  const filtered = useMemo(() => {
    if (!submissions) return [];
    const query = search.trim().toLowerCase();
    return submissions.filter((s) => {
      const matchesSearch =
        !query || s.studentName.toLowerCase().includes(query) || s.studentEmail.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!assignment || !submissions) return <Spinner />;

  return (
    <div className="space-y-6">
      <Link href="/admin/assignments" className="flex items-center gap-1 text-sm text-slate-500 hover:underline dark:text-slate-400">
        <ArrowLeft className="h-4 w-4" /> Back to all assignments
      </Link>

      <Card>
        <CardHeader
          title={assignment.title}
          description={`${assignment.subjectName} · ${assignment.className} · ${assignment.teacherName}`}
          action={<Badge className={assignmentStatusStyles[assignment.status]}>{assignment.status}</Badge>}
        />
        <CardBody className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span>Deadline: {formatDate(assignment.deadline)}</span>
          <span>Max marks: {assignment.maxMarks}</span>
          <span>{submissions.length} submission(s) total</span>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Submissions" description="Read-only view — monitoring only. Grading is done by the assignment's teacher." />
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by student name or email..."
                className="w-full rounded-md border-0 py-1.5 pl-9 pr-3 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SubmissionStatus | "All");
                setPage(1);
              }}
              className="sm:w-48"
            >
              {statusFilterOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "All" ? "All statuses" : opt}
                </option>
              ))}
            </Select>
          </div>

          <SubmissionsTable
            submissions={pageItems}
            showEmail
            showFeedback
            showLastUpdated
            emptyTitle={submissions.length === 0 ? "No submissions yet" : "No submissions match your search/filter"}
          />

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <span>
                Page {page} of {totalPages} ({filtered.length} result{filtered.length === 1 ? "" : "s"})
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
