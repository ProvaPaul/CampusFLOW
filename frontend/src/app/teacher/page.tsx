"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";
import { assignmentsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { AssignmentDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Spinner } from "@/components/ui/Spinner";
import { assignmentStatusStyles, formatDate, isDeadlinePassed } from "@/lib/utils";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);

  const load = () => assignmentsApi.getAll().then(setAssignments);

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (a: AssignmentDto, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${a.title}"? This also removes it from students' view.`)) return;
    try {
      await assignmentsApi.remove(a.id);
      toast.success("Assignment deleted");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!assignments) return <Spinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Assignments</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assignments you have created across your assigned subjects/classes.</p>

      {assignments.length === 0 ? (
        <Card className="mt-6">
          <EmptyState title="No assignments yet" description="Create your first assignment to get started." />
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => (
            <Link key={a.id} href={`/teacher/assignments/${a.id}`}>
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2 px-5 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                  <Badge className={assignmentStatusStyles[a.status]}>{a.status}</Badge>
                </div>
                <div className="flex-1 px-5 py-2 text-sm text-slate-500 dark:text-slate-400">
                  <p>
                    {a.subjectName} · {a.className}
                  </p>
                  <p className={isDeadlinePassed(a.deadline) ? "text-red-600 dark:text-red-400" : ""}>Due {formatDate(a.deadline)}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{a.submissionCount} submission(s)</span>
                  <button
                    onClick={(e) => handleDelete(a, e)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
