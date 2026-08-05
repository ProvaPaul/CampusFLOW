"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { assignmentsApi } from "@/lib/api";
import type { AssignmentDto, AssignmentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ExportMenu } from "@/components/export/ExportMenu";
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
  const [statusFilter, setStatusFilter] = useState<AssignmentStatus | "All">("All");
  const [teacherFilter, setTeacherFilter] = useState("All");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [deadlineFrom, setDeadlineFrom] = useState("");
  const [deadlineTo, setDeadlineTo] = useState("");
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    assignmentsApi.getAll().then(setAssignments);
  }, []);

  // Seed the dropdown filters from deep-link query params (e.g. dashboard's "Draft assignments" link)
  // so both entry points — direct navigation and cross-page links — land in the same filter UI.
  useEffect(() => {
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");
    const status = searchParams.get("status") as AssignmentStatus | null;
    if (subjectId) setSubjectFilter(subjectId);
    if (classId) setClassFilter(classId);
    if (status) setStatusFilter(status);
  }, [searchParams]);

  const { teacherOptions, subjectOptions, classOptions } = useMemo(() => {
    const teachers = new Map<string, string>();
    const subjects = new Map<string, string>();
    const classes = new Map<string, string>();
    (assignments ?? []).forEach((a) => {
      teachers.set(a.teacherId, a.teacherName);
      subjects.set(a.subjectId, a.subjectName);
      classes.set(a.classId, a.className);
    });
    return {
      teacherOptions: Array.from(teachers.entries()),
      subjectOptions: Array.from(subjects.entries()),
      classOptions: Array.from(classes.entries()),
    };
  }, [assignments]);

  const filtered = useMemo(() => {
    if (!assignments) return [];
    const query = search.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchesQuery =
        !query || a.title.toLowerCase().includes(query) || a.teacherName.toLowerCase().includes(query) || a.subjectName.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "All" || a.status === statusFilter;
      const matchesTeacher = teacherFilter === "All" || a.teacherId === teacherFilter;
      const matchesSubject = subjectFilter === "All" || a.subjectId === subjectFilter;
      const matchesClass = classFilter === "All" || a.classId === classFilter;
      const matchesFrom = !deadlineFrom || new Date(a.deadline) >= new Date(deadlineFrom);
      const matchesTo = !deadlineTo || new Date(a.deadline) <= new Date(`${deadlineTo}T23:59:59`);
      return matchesQuery && matchesStatus && matchesTeacher && matchesSubject && matchesClass && matchesFrom && matchesTo;
    });
  }, [assignments, search, statusFilter, teacherFilter, subjectFilter, classFilter, deadlineFrom, deadlineTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilter =
    statusFilter !== "All" || teacherFilter !== "All" || subjectFilter !== "All" || classFilter !== "All" || deadlineFrom || deadlineTo;

  const clearFilters = () => {
    setStatusFilter("All");
    setTeacherFilter("All");
    setSubjectFilter("All");
    setClassFilter("All");
    setDeadlineFrom("");
    setDeadlineTo("");
    router.replace("/admin/assignments");
  };

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">All Assignments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Read-only view of every assignment across all teachers and classes.</p>
        </div>
        <ExportMenu
          filenameBase="assignments"
          title="Assignments"
          columns={[
            { header: "Title", accessor: (a: AssignmentDto) => a.title },
            { header: "Class", accessor: (a: AssignmentDto) => a.className },
            { header: "Subject", accessor: (a: AssignmentDto) => a.subjectName },
            { header: "Teacher", accessor: (a: AssignmentDto) => a.teacherName },
            { header: "Deadline", accessor: (a: AssignmentDto) => formatDate(a.deadline) },
            { header: "Status", accessor: (a: AssignmentDto) => a.status },
            { header: "Submissions", accessor: (a: AssignmentDto) => a.submissionCount },
          ]}
          rows={filtered}
        />
      </div>

      {hasFilter && (
        <div className="mt-3 flex items-center gap-2">
          <Badge className="bg-indigo-50 text-indigo-700 ring-indigo-300 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-800">
            {filtered.length} of {assignments.length} assignments match your filters
          </Badge>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" /> Clear filters
          </Button>
        </div>
      )}

      <Card className="mt-6 overflow-hidden">
        <div className="space-y-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search by title, teacher, or subject..."
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as AssignmentStatus | "All");
                setPage(1);
              }}
            >
              <option value="All">All statuses</option>
              <option value="Draft">Draft</option>
              <option value="Published">Published</option>
            </Select>
            <Select
              value={teacherFilter}
              onChange={(e) => {
                setTeacherFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All teachers</option>
              {teacherOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All subjects</option>
              {subjectOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All classes</option>
              {classOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <input
              type="date"
              value={deadlineFrom}
              onChange={(e) => {
                setDeadlineFrom(e.target.value);
                setPage(1);
              }}
              aria-label="Deadline from"
              className="rounded-md border-0 px-3 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
            />
            <input
              type="date"
              value={deadlineTo}
              onChange={(e) => {
                setDeadlineTo(e.target.value);
                setPage(1);
              }}
              aria-label="Deadline to"
              className="rounded-md border-0 px-3 py-1.5 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
            />
          </div>
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
