"use client";

import { useEffect, useState } from "react";
import { assignmentsApi } from "@/lib/api";
import type { AssignmentDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Spinner } from "@/components/ui/Spinner";
import { assignmentStatusStyles, formatDate } from "@/lib/utils";

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);

  useEffect(() => {
    assignmentsApi.getAll().then(setAssignments);
  }, []);

  if (!assignments) return <Spinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">All Assignments</h1>
      <p className="mt-1 text-sm text-slate-500">Read-only view of every assignment across all teachers and classes.</p>

      <Card className="mt-6 overflow-hidden">
        {assignments.length === 0 ? (
          <EmptyState title="No assignments yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Title", "Class", "Subject", "Teacher", "Deadline", "Status", "Submissions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{a.title}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.className}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.subjectName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.teacherName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(a.deadline)}</td>
                    <td className="px-4 py-3">
                      <Badge className={assignmentStatusStyles[a.status]}>{a.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{a.submissionCount}</td>
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
