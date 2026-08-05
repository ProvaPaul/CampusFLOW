"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { assignmentsApi, submissionsApi } from "@/lib/api";
import type { AssignmentDto, SubmissionDto, SubmissionStatus } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { SubmissionsTable } from "@/components/shared/SubmissionsTable";
import { ExportMenu } from "@/components/export/ExportMenu";
import { assignmentStatusStyles, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;
const statusFilterOptions: Array<SubmissionStatus | "All"> = ["All", "Submitted", "Late", "NeedsRevision", "Graded"];

export default function AdminAssignmentSubmissionsPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | "All">("All");
  const [minMarks, setMinMarks] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
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
      const matchesMinMarks = !minMarks || (s.marks !== null && s.marks >= Number(minMarks));
      const matchesMaxMarks = !maxMarks || (s.marks !== null && s.marks <= Number(maxMarks));
      return matchesSearch && matchesStatus && matchesMinMarks && matchesMaxMarks;
    });
  }, [submissions, search, statusFilter, minMarks, maxMarks]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!assignment || !submissions) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Assignments", href: "/admin/assignments" },
          { label: assignment.title },
        ]}
      />

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
        <CardHeader
          title="Submissions"
          description="Read-only view — monitoring only. Grading is done by the assignment's teacher."
          action={
            <ExportMenu
              filenameBase={`${assignment.title.toLowerCase().replace(/\s+/g, "-")}-submissions`}
              title={`Submissions — ${assignment.title}`}
              columns={[
                { header: "Student", accessor: (s: SubmissionDto) => s.studentName },
                { header: "Email", accessor: (s: SubmissionDto) => s.studentEmail },
                { header: "Status", accessor: (s: SubmissionDto) => s.status },
                { header: "Marks", accessor: (s: SubmissionDto) => s.marks ?? "" },
                { header: "Submitted", accessor: (s: SubmissionDto) => formatDate(s.submittedAt) },
              ]}
              rows={filtered}
            />
          }
        />
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by student name or email..."
              className="flex-1"
            />
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
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={minMarks}
                onChange={(e) => {
                  setMinMarks(e.target.value);
                  setPage(1);
                }}
                placeholder="Min marks"
                aria-label="Minimum marks"
                className="w-24 rounded-md border-0 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500"
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                value={maxMarks}
                onChange={(e) => {
                  setMaxMarks(e.target.value);
                  setPage(1);
                }}
                placeholder="Max marks"
                aria-label="Maximum marks"
                className="w-24 rounded-md border-0 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          <SubmissionsTable
            submissions={pageItems}
            showEmail
            showFeedback
            showLastUpdated
            emptyTitle={submissions.length === 0 ? "No submissions yet" : "No submissions match your search/filter"}
          />

          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} itemLabel="result" />
        </CardBody>
      </Card>
    </div>
  );
}
