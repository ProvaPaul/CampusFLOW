"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardList, CheckCircle2, Clock, GraduationCap } from "lucide-react";
import { useStudentDashboard } from "@/lib/use-student-dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Spinner";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { formatDate, formatRelative, isDeadlinePassed, submissionStatusStyles } from "@/lib/utils";

export default function StudentDashboardPage() {
  const { data, loading } = useStudentDashboard();

  if (loading || !data) return <SkeletonDashboard />;

  const { assignments, upcoming, recentlySubmitted, gradedSubmissions, pendingCount } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Student Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your assignments, submissions, and grades at a glance.</p>
      </div>

      <StatCardGrid className="sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Total Assignments" value={assignments.length} />
        <StatCard icon={Clock} label="Awaiting Submission" value={pendingCount} tone={pendingCount > 0 ? "warning" : "default"} />
        <StatCard icon={CheckCircle2} label="Submitted" value={data.mySubmissions.length} tone="success" />
        <StatCard icon={GraduationCap} label="Graded" value={gradedSubmissions.length} tone="success" />
      </StatCardGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Upcoming Assignments" description="Not yet submitted, due soonest first." />
          <CardBody>
            {upcoming.length === 0 ? (
              <EmptyState title="Nothing due" description="You're all caught up." icon={CheckCircle2} />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Link href={`/student/assignments/${a.id}`} className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
                        {a.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{a.subjectName}</p>
                    </Link>
                    <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{formatDate(a.deadline)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Grades &amp; Feedback" description="Your most recently graded submissions." />
          <CardBody>
            {gradedSubmissions.length === 0 ? (
              <EmptyState title="No grades yet" description="Grades and feedback will appear here once a teacher reviews your work." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {gradedSubmissions.slice(0, 4).map((s) => (
                  <li key={s.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{s.assignmentTitle}</p>
                      <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {s.marks}/{s.maxMarks}
                      </span>
                    </div>
                    {s.feedback && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{s.feedback}</p>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {recentlySubmitted.length > 0 && (
        <Card>
          <CardHeader title="Recently Submitted" description="Your latest submissions and their current status." />
          <CardBody>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentlySubmitted.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{s.assignmentTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Submitted {formatRelative(s.submittedAt)}</p>
                  </div>
                  <Badge className={submissionStatusStyles[s.status]}>{s.status}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">All Assignments</h2>
        {assignments.length === 0 ? (
          <Card>
            <EmptyState title="No assignments yet" description="Check back later once your teachers publish assignments." />
          </Card>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          >
            {assignments.map((a) => {
              const overdue = isDeadlinePassed(a.deadline) && !a.mySubmission;
              return (
                <motion.div key={a.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                  <Link href={`/student/assignments/${a.id}`}>
                    <Card interactive className="flex h-full flex-col">
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
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
