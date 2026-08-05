"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { assignmentsApi } from "@/lib/api";
import type { AssignmentDto, AssignmentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { assignmentStatusStyles, formatDate } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function AdminAssignmentsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminAssignmentsContent />
    </Suspense>
  );
}

function AdminAssignmentsContent() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectId = searchParams.get("subjectId");
  const classId = searchParams.get("classId");
  const status = searchParams.get("status") as AssignmentStatus | null;

  useEffect(() => {
    assignmentsApi.getAll().then(setAssignments);
  }, []);

  const filtered = useMemo(() => {
    if (!assignments) return [];
    const query = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchesQuery =
        !query || a.title.toLowerCase().includes(query) || a.teacherName.toLowerCase().includes(query) || a.subjectName.toLowerCase().includes(query);
      return (
        matchesQuery &&
        (!subjectId || a.subjectId === subjectId) &&
        (!classId || a.classId === classId) &&
        (!status || a.status === status)
      );
    });
  }, [assignments, search, subjectId, classId, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filterLabel = filtered.length > 0 ? (subjectId ? filtered[0].subjectName : classId ? filtered[0].className : status) : null;
  const hasFilter = subjectId || classId || status;

  const columns: DataTableColumn<AssignmentDto>[] = [
    { key: "title", header: "Title", sortAccessor: (a) => a.title, render: (a) => <span className="font-medium text-slate-900 dark:text-slate-100">{a.title}</span> },
    { key: "class", header: "Class", sortAccessor: (a) => a.className, render: (a) => <span className="text-slate-600 dark:text-slate-400">{a.className}</span> },
    { key: "subject", header: "Subject", sortAccessor: (a) => a.subjectName, render: (a) => <span className="text-slate-600 dark:text-slate-400">{a.subjectName}</span> },
    { key: "teacher", header: "Teacher", sortAccessor: (a) => a.teacherName, render: (a) => <span className="text-slate-600 dark:text-slate-400">{a.teacherName}</span> },
    { key: "deadline", header: "Deadline", sortAccessor: (a) => a.deadline, render: (a) => <span className="text-slate-600 dark:text-slate-400">{formatDate(a.deadline)}</span> },
    { key: "status", header: "Status", sortAccessor: (a) => a.status, render: (a) => <Badge className={assignmentStatusStyles[a.status]}>{a.status}</Badge> },
    {
      key: "submissions",
      header: "Submissions",
      sortAccessor: (a) => a.submissionCount,
      align: "right",
      render: (a) => <span className="text-slate-600 dark:text-slate-400">{a.submissionCount}</span>,
    },
  ];

  if (!assignments) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">All Assignments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Read-only view of every assignment across all teachers and classes.</p>
        <div className="mt-6">
          <SkeletonTable columns={7} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">All Assignments</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Read-only view of every assignment across all teachers and classes.</p>

      {hasFilter && (
        <div className="mt-3 flex items-center gap-2">
          <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-800">
            Filtered: {filterLabel ?? "no matches"}
          </Badge>
          <Link href="/admin/assignments" className="flex items-center gap-1 text-xs text-slate-500 hover:underline dark:text-slate-400">
            <X className="h-3 w-3" /> Clear filter
          </Link>
        </div>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by title, teacher, or subject..."
          />
        </div>
        <div className="p-4">
          <DataTable
            data={pageItems}
            columns={columns}
            keyExtractor={(a) => a.id}
            onRowClick={(a) => router.push(`/admin/assignments/${a.id}`)}
            mobileBadge={(a) => <Badge className={assignmentStatusStyles[a.status]}>{a.status}</Badge>}
            emptyTitle="No assignments match this filter"
          />
          <div className="mt-4">
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} itemLabel="assignment" />
          </div>
        </div>
      </Card>
    </div>
  );
}
