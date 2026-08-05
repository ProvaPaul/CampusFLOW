"use client";

import { useState } from "react";
import { CheckCircle2, ClipboardList, FileEdit, TrendingUp } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { DonutChart } from "@/components/admin/charts/DonutChart";
import { SubmissionTrendChart } from "@/components/admin/charts/SubmissionTrendChart";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { ExportMenu } from "@/components/export/ExportMenu";
import { CHART_COLORS } from "@/components/admin/charts/chart-theme";
import { usePlatformAnalytics } from "@/lib/use-platform-analytics";
import type {
  AssignmentAnalytics,
  ClassAnalyticsRow,
  StudentAnalyticsRow,
  SubmissionAnalytics,
  TeacherAnalyticsRow,
  TrendPoint,
} from "@/lib/platform-analytics";

const TABS = [
  { value: "assignments", label: "Assignments" },
  { value: "submissions", label: "Submissions" },
  { value: "teachers", label: "Teachers" },
  { value: "students", label: "Students" },
  { value: "classes", label: "Classes" },
];

export default function AdminAnalyticsPage() {
  const { data, loading } = usePlatformAnalytics();
  const [tab, setTab] = useState("assignments");

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Analytics" }]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Deep-dive breakdowns across assignments, submissions, teachers, students, and classes.
          </p>
        </div>
        <Tabs items={TABS} value={tab} onChange={setTab} />
      </div>

      {tab === "assignments" && <AssignmentsTab data={data.assignment} />}
      {tab === "submissions" && <SubmissionsTab data={data.submission} />}
      {tab === "teachers" && <TeachersTab rows={data.teachers} />}
      {tab === "students" && <StudentsTab rows={data.students} />}
      {tab === "classes" && <ClassesTab rows={data.classes} />}
    </div>
  );
}

function AssignmentsTab({ data }: { data: AssignmentAnalytics }) {
  return (
    <div className="space-y-4">
      <StatCardGrid>
        <StatCard icon={ClipboardList} label="Published" value={data.published} tone="success" />
        <StatCard icon={FileEdit} label="Draft" value={data.draft} tone="warning" />
        <StatCard icon={TrendingUp} label="Average Marks" value={data.averageMarks !== null ? `${data.averageMarks}%` : "—"} />
        <StatCard icon={CheckCircle2} label="Completion Rate" value={data.completionRate !== null ? `${data.completionRate}%` : "—"} />
      </StatCardGrid>
      <Card>
        <CardHeader title="Published vs. Draft" description="Current assignment status split across the platform." />
        <CardBody className="h-56">
          <DonutChart
            data={[
              { name: "Published", value: data.published },
              { name: "Draft", value: data.draft },
            ]}
            colors={[CHART_COLORS.emerald, CHART_COLORS.slate]}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function trendToChartData(points: TrendPoint[]) {
  return points.map((p) => ({ date: p.label, submissions: p.count }));
}

function SubmissionsTab({ data }: { data: SubmissionAnalytics }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card>
        <CardHeader title="Daily" description="Last 14 days." />
        <CardBody className="h-64">
          <SubmissionTrendChart data={trendToChartData(data.daily)} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Weekly" description="Last 8 weeks." />
        <CardBody className="h-64">
          <SubmissionTrendChart data={trendToChartData(data.weekly)} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Monthly" description="Last 6 months." />
        <CardBody className="h-64">
          <SubmissionTrendChart data={trendToChartData(data.monthly)} />
        </CardBody>
      </Card>
    </div>
  );
}

function TeachersTab({ rows }: { rows: TeacherAnalyticsRow[] }) {
  const columns: DataTableColumn<TeacherAnalyticsRow>[] = [
    { key: "name", header: "Teacher", render: (r) => r.teacherName, sortAccessor: (r) => r.teacherName },
    {
      key: "created",
      header: "Assignments Created",
      render: (r) => r.assignmentsCreated,
      sortAccessor: (r) => r.assignmentsCreated,
      align: "right",
    },
    { key: "pending", header: "Pending Reviews", render: (r) => r.pendingReviews, sortAccessor: (r) => r.pendingReviews, align: "right" },
    {
      key: "grading",
      header: "Avg. Grading Time",
      render: (r) => (r.averageGradingHours !== null ? `${r.averageGradingHours}h` : "—"),
      sortAccessor: (r) => r.averageGradingHours ?? -1,
      align: "right",
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Teacher Analytics"
        description="Assignments created, pending reviews, and average time from submission to grading."
        action={
          <ExportMenu
            filenameBase="teacher-analytics"
            title="Teacher Analytics"
            columns={[
              { header: "Teacher", accessor: (r: TeacherAnalyticsRow) => r.teacherName },
              { header: "Assignments Created", accessor: (r: TeacherAnalyticsRow) => r.assignmentsCreated },
              { header: "Pending Reviews", accessor: (r: TeacherAnalyticsRow) => r.pendingReviews },
              { header: "Avg. Grading Hours", accessor: (r: TeacherAnalyticsRow) => r.averageGradingHours ?? "" },
            ]}
            rows={rows}
          />
        }
      />
      <div className="p-4">
        <DataTable data={rows} columns={columns} keyExtractor={(r) => r.teacherId} emptyTitle="No teachers yet" />
      </div>
    </Card>
  );
}

function StudentsTab({ rows }: { rows: StudentAnalyticsRow[] }) {
  const columns: DataTableColumn<StudentAnalyticsRow>[] = [
    { key: "name", header: "Student", render: (r) => r.studentName, sortAccessor: (r) => r.studentName },
    {
      key: "score",
      header: "Average Score",
      render: (r) => (r.averageScore !== null ? `${r.averageScore}%` : "—"),
      sortAccessor: (r) => r.averageScore ?? -1,
      align: "right",
    },
    {
      key: "rate",
      header: "Submission Rate",
      render: (r) => (r.submissionRate !== null ? `${r.submissionRate}%` : "—"),
      sortAccessor: (r) => r.submissionRate ?? -1,
      align: "right",
    },
    { key: "late", header: "Late Submissions", render: (r) => r.lateCount, sortAccessor: (r) => r.lateCount, align: "right" },
  ];

  return (
    <Card>
      <CardHeader
        title="Student Analytics"
        description="Average score, submission rate, and late submission count."
        action={
          <ExportMenu
            filenameBase="student-analytics"
            title="Student Analytics"
            columns={[
              { header: "Student", accessor: (r: StudentAnalyticsRow) => r.studentName },
              { header: "Average Score", accessor: (r: StudentAnalyticsRow) => r.averageScore ?? "" },
              { header: "Submission Rate", accessor: (r: StudentAnalyticsRow) => r.submissionRate ?? "" },
              { header: "Late Submissions", accessor: (r: StudentAnalyticsRow) => r.lateCount },
            ]}
            rows={rows}
          />
        }
      />
      <div className="p-4">
        <DataTable data={rows} columns={columns} keyExtractor={(r) => r.studentId} emptyTitle="No students yet" />
      </div>
    </Card>
  );
}

function ClassesTab({ rows }: { rows: ClassAnalyticsRow[] }) {
  const columns: DataTableColumn<ClassAnalyticsRow>[] = [
    { key: "name", header: "Class", render: (r) => r.className, sortAccessor: (r) => r.className },
    {
      key: "marks",
      header: "Average Marks",
      render: (r) => (r.averageMarks !== null ? `${r.averageMarks}%` : "—"),
      sortAccessor: (r) => r.averageMarks ?? -1,
      align: "right",
    },
    {
      key: "completion",
      header: "Completion %",
      render: (r) => (r.completionPercentage !== null ? `${r.completionPercentage}%` : "—"),
      sortAccessor: (r) => r.completionPercentage ?? -1,
      align: "right",
    },
    { key: "students", header: "Active Students", render: (r) => r.activeStudents, sortAccessor: (r) => r.activeStudents, align: "right" },
  ];

  return (
    <Card>
      <CardHeader
        title="Class Analytics"
        description="Average marks, completion percentage, and active student count per class."
        action={
          <ExportMenu
            filenameBase="class-analytics"
            title="Class Analytics"
            columns={[
              { header: "Class", accessor: (r: ClassAnalyticsRow) => r.className },
              { header: "Average Marks", accessor: (r: ClassAnalyticsRow) => r.averageMarks ?? "" },
              { header: "Completion %", accessor: (r: ClassAnalyticsRow) => r.completionPercentage ?? "" },
              { header: "Active Students", accessor: (r: ClassAnalyticsRow) => r.activeStudents },
            ]}
            rows={rows}
          />
        }
      />
      <div className="p-4">
        <DataTable data={rows} columns={columns} keyExtractor={(r) => r.classId} emptyTitle="No classes yet" />
      </div>
    </Card>
  );
}
