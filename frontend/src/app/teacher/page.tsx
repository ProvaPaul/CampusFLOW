"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Trash2, Layers, FileEdit, Megaphone, Inbox, Clock } from "lucide-react";
import type { AssignmentDto } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/api-client";
import { assignmentsApi } from "@/lib/api";
import { useTeacherDashboard } from "@/lib/use-teacher-dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Spinner";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { assignmentStatusStyles, formatDate, isDeadlinePassed } from "@/lib/utils";

export default function TeacherDashboardPage() {
  const { data, loading, reload } = useTeacherDashboard();

  const handleDelete = async (a: AssignmentDto, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${a.title}"? This also removes it from students' view.`)) return;
    try {
      await assignmentsApi.remove(a.id);
      toast.success("Assignment deleted");
      reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading || !data) return <SkeletonDashboard />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Teacher Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your classes, assignments, and what needs your attention.</p>
      </div>

      <StatCardGrid className="sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={Layers} label="My Classes" value={data.myClassCount} />
        <StatCard icon={FileEdit} label="Draft Assignments" value={data.draftCount} tone="warning" />
        <StatCard icon={Megaphone} label="Published Assignments" value={data.publishedCount} tone="success" />
        <StatCard icon={Inbox} label="Pending Reviews" value={data.pendingReviews} tone={data.pendingReviews > 0 ? "warning" : "default"} />
        <StatCard icon={Clock} label="Upcoming Deadlines" value={data.upcomingDeadlines.length} />
      </StatCardGrid>

      {data.upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader title="Upcoming Deadlines" description="Your published assignments due soonest." />
          <CardBody>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.upcomingDeadlines.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Link href={`/teacher/assignments/${a.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
                      {a.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {a.subjectName} · {a.className}
                    </p>
                  </Link>
                  <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(a.deadline)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">My Assignments</h2>
        {data.assignments.length === 0 ? (
          <Card>
            <EmptyState title="No assignments yet" description="Create your first assignment to get started." />
          </Card>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {data.assignments.map((a) => (
              <motion.div key={a.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                <Link href={`/teacher/assignments/${a.id}`}>
                  <Card interactive className="flex h-full flex-col">
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
                        aria-label={`Delete ${a.title}`}
                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
