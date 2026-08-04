"use client";

import { Users, Layers, BookOpen, ClipboardList, FileEdit, Megaphone, Inbox, CheckCircle2, UserCog } from "lucide-react";
import { useAdminAnalytics } from "@/lib/use-admin-analytics";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { QuickInsights } from "@/components/admin/QuickInsights";
import { ActivityFeed } from "@/components/admin/ActivityFeed";

export default function AdminDashboardPage() {
  const { data, loading } = useAdminAnalytics();

  if (loading || !data) return <Spinner />;

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

      <StatCardGrid>
        <StatCard icon={Layers} label="Total Classes" value={global.totalClasses} />
        <StatCard icon={BookOpen} label="Total Subjects" value={global.totalSubjects} />
        <StatCard icon={UserCog} label="Total Teachers" value={global.totalTeachers} />
        <StatCard icon={Users} label="Total Students" value={global.totalStudents} />
        <StatCard icon={ClipboardList} label="Total Assignments" value={global.totalAssignments} />
        <StatCard icon={FileEdit} label="Draft Assignments" value={global.draftAssignments} tone="warning" />
        <StatCard icon={Megaphone} label="Published Assignments" value={global.publishedAssignments} tone="success" />
        <StatCard icon={Inbox} label="Pending Reviews" value={global.pendingReviews} tone={global.pendingReviews > 0 ? "warning" : "default"} />
        <StatCard icon={CheckCircle2} label="Completed Submissions" value={global.completedSubmissions} tone="success" />
      </StatCardGrid>

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
