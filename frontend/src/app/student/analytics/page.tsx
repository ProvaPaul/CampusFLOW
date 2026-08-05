"use client";

import { AlertTriangle, CheckCircle2, TrendingUp, Send } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardBody } from "@/components/ui/Card";
import { SkeletonStatCard } from "@/components/ui/Skeleton";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { useStudentAnalytics } from "@/lib/use-student-analytics";

export default function StudentAnalyticsPage() {
  const { data, loading } = useStudentAnalytics();

  if (loading || !data) {
    return (
      <StatCardGrid>
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </StatCardGrid>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "My Assignments", href: "/student" }, { label: "Analytics" }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your performance across every assignment.</p>
      </div>

      <StatCardGrid>
        <StatCard icon={TrendingUp} label="Average Score" value={data.averageScore !== null ? `${data.averageScore}%` : "—"} />
        <StatCard icon={Send} label="Submission Rate" value={data.submissionRate !== null ? `${data.submissionRate}%` : "—"} />
        <StatCard icon={AlertTriangle} label="Late Submissions" value={data.lateCount} tone={data.lateCount > 0 ? "warning" : "default"} />
        <StatCard icon={CheckCircle2} label="Graded" value={`${data.gradedCount} of ${data.totalSubmitted}`} tone="success" />
      </StatCardGrid>

      <Card>
        <CardBody className="text-sm text-slate-600 dark:text-slate-400">
          You&apos;ve submitted {data.totalSubmitted} of {data.totalAvailable} available assignment(s).
        </CardBody>
      </Card>
    </div>
  );
}
