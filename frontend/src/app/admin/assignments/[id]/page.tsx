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
        <CardHeader title="Submissions" description="Read-only view — monitoring only. Grading is done by the assignment's teacher." />
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
