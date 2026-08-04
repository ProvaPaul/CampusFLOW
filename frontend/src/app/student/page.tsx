"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { assignmentsApi } from "@/lib/api";
import type { AssignmentDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, Spinner } from "@/components/ui/Spinner";
import { formatDate, isDeadlinePassed, submissionStatusStyles } from "@/lib/utils";

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);

  useEffect(() => {
    assignmentsApi.getAll().then(setAssignments);
  }, []);

  if (!assignments) return <Spinner />;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Assignments</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Published assignments for your class.</p>

      {assignments.length === 0 ? (
        <Card className="mt-6">
          <EmptyState title="No assignments yet" description="Check back later once your teachers publish assignments." />
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((a) => {
            const overdue = isDeadlinePassed(a.deadline) && !a.mySubmission;
            return (
              <Link key={a.id} href={`/student/assignments/${a.id}`}>
                <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-2 px-5 pt-4">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{a.title}</h3>
                    {a.mySubmission ? (
                      <Badge className={submissionStatusStyles[a.mySubmission.status]}>{a.mySubmission.status}</Badge>
                    ) : (
                      <Badge
                        className={
                          overdue
                            ? "bg-red-50 text-red-700 ring-red-300 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-800"
                            : "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
                        }
                      >
                        {overdue ? "Missed" : "Not submitted"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 px-5 py-2 text-sm text-slate-500 dark:text-slate-400">
                    <p>{a.subjectName}</p>
                    <p className={isDeadlinePassed(a.deadline) ? "text-red-600 dark:text-red-400" : ""}>Due {formatDate(a.deadline)}</p>
                  </div>
                  <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {a.mySubmission?.marks != null ? `Marks: ${a.mySubmission.marks}/${a.maxMarks}` : `Max marks: ${a.maxMarks}`}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
