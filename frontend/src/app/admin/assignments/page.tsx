"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { assignmentsApi } from "@/lib/api";
import type { AssignmentDto, AssignmentStatus } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Spinner } from "@/components/ui/Spinner";
import { assignmentStatusStyles, formatDate } from "@/lib/utils";

export default function AdminAssignmentsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AdminAssignmentsContent />
    </Suspense>
  );
}

function AdminAssignmentsContent() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const subjectId = searchParams.get("subjectId");
  const classId = searchParams.get("classId");
  const status = searchParams.get("status") as AssignmentStatus | null;

  useEffect(() => {
    assignmentsApi.getAll().then(setAssignments);
  }, []);

  const filtered = useMemo(() => {
    if (!assignments) return null;
    return assignments.filter(
      (a) => (!subjectId || a.subjectId === subjectId) && (!classId || a.classId === classId) && (!status || a.status === status)
    );
  }, [assignments, subjectId, classId, status]);

  if (!assignments || !filtered) return <Spinner />;

  const filterLabel = filtered.length > 0 ? (subjectId ? filtered[0].subjectName : classId ? filtered[0].className : status) : null;
  const hasFilter = subjectId || classId || status;

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
        {filtered.length === 0 ? (
          <EmptyState title="No assignments match this filter" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  {["Title", "Class", "Subject", "Teacher", "Deadline", "Status", "Submissions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => router.push(`/admin/assignments/${a.id}`)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{a.className}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{a.subjectName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{a.teacherName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{formatDate(a.deadline)}</td>
                    <td className="px-4 py-3">
                      <Badge className={assignmentStatusStyles[a.status]}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{a.submissionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
