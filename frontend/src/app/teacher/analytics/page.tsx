"use client";

import { CheckCircle2, ClipboardList, FileEdit, Inbox, Timer } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SkeletonCard, SkeletonStatCard } from "@/components/ui/Skeleton";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { SubmissionTrendChart } from "@/components/admin/charts/SubmissionTrendChart";
import { useTeacherAnalytics } from "@/lib/use-teacher-analytics";

export default function TeacherAnalyticsPage() {
  const { data, loading } = useTeacherAnalytics();

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <StatCardGrid>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </StatCardGrid>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "My Assignments", href: "/teacher" }, { label: "Analytics" }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Analytics</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your assignment and grading activity.</p>
      </div>

      <StatCardGrid>
        <StatCard icon={ClipboardList} label="Assignments Created" value={data.assignmentsCreated} />
        <StatCard icon={CheckCircle2} label="Published" value={data.published} tone="success" />
        <StatCard icon={FileEdit} label="Draft" value={data.draft} tone="warning" />
        <StatCard icon={Inbox} label="Pending Reviews" value={data.pendingReviews} tone={data.pendingReviews > 0 ? "warning" : "default"} />
        <StatCard icon={Timer} label="Avg. Grading Time" value={data.averageGradingHours !== null ? `${data.averageGradingHours}h` : "—"} />
      </StatCardGrid>

      <Card>
        <CardHeader title="Submissions Received" description="Last 14 days, across all your assignments." />
        <CardBody className="h-64">
          <SubmissionTrendChart data={data.submissionTrend} />
        </CardBody>
      </Card>
    </div>
  );
}
