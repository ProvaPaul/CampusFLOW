"use client";

import { motion } from "framer-motion";
import { Users, Layers, BookOpen, ClipboardList, FileEdit, Megaphone, Inbox, CheckCircle2, UserCog } from "lucide-react";
import { useAdminAnalytics } from "@/lib/use-admin-analytics";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SkeletonDashboard } from "@/components/ui/Skeleton";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { QuickInsights } from "@/components/admin/QuickInsights";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { SubmissionTrendChart } from "@/components/admin/charts/SubmissionTrendChart";
import { ClassActivityChart } from "@/components/admin/charts/ClassActivityChart";
import { CHART_COLORS } from "@/components/admin/charts/chart-theme";

export default function AdminDashboardPage() {
  const { data, loading } = useAdminAnalytics();

  if (loading || !data) return <SkeletonDashboard />;

  const { global } = data;

  if (global.totalClasses === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Overview of the CampusFlow platform.</p>

        <Card className="mt-6">
          <CardBody>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Getting started</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
              <li>Create classes/courses under the Classes tab.</li>
              <li>Add subjects for each class under the Subjects tab.</li>
              <li>Create teacher and student accounts under Users.</li>
              <li>Assign teachers to subjects/classes under Teacher Assignments.</li>
              <li>Teachers can then create assignments; students can submit and receive grades.</li>
            </ol>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          A real-time snapshot of the institution — classes, subjects, staffing, and assignment activity.
        </p>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        <StatCardGrid>
          {[
            { icon: Layers, label: "Total Classes", value: global.totalClasses },
            { icon: BookOpen, label: "Total Subjects", value: global.totalSubjects },
            { icon: UserCog, label: "Total Teachers", value: global.totalTeachers },
            { icon: Users, label: "Total Students", value: global.totalStudents },
            { icon: ClipboardList, label: "Total Assignments", value: global.totalAssignments },
            { icon: FileEdit, label: "Draft Assignments", value: global.draftAssignments, tone: "warning" as const },
            { icon: Megaphone, label: "Published Assignments", value: global.publishedAssignments, tone: "success" as const },
            {
              icon: Inbox,
              label: "Pending Reviews",
              value: global.pendingReviews,
              tone: global.pendingReviews > 0 ? ("warning" as const) : ("default" as const),
            },
            { icon: CheckCircle2, label: "Completed Submissions", value: global.completedSubmissions, tone: "success" as const },
          ].map((card) => (
            <motion.div key={card.label} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </StatCardGrid>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Assignment Status" description="Draft vs. published across the platform." />
          <CardBody className="h-56">
            <DonutChart data={data.charts.assignmentStatus} colors={[CHART_COLORS.emerald, CHART_COLORS.slate]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="User Distribution" description="Accounts by role." />
          <CardBody className="h-56">
            <DonutChart data={data.charts.userDistribution} colors={[CHART_COLORS.indigo, CHART_COLORS.blue, CHART_COLORS.purple]} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Submission Trends" description="Submissions received over the last 7 days." />
          <CardBody className="h-56">
            <SubmissionTrendChart data={data.charts.submissionTrend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Class Activity" description="Active (published) assignments per class." />
          <CardBody className="h-56">
            <ClassActivityChart data={data.charts.classActivity} />
          </CardBody>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Quick Insights</h2>
        <QuickInsights data={data.insights} />
      </div>

      <Card>
        <CardHeader title="Recent Activity" description="The latest events across the platform." />
        <CardBody>
          <ActivityFeed events={data.activity} />
        </CardBody>
      </Card>
    </div>
  );
}
