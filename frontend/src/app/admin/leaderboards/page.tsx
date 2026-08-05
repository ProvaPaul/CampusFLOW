"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { LeaderboardCard } from "@/components/admin/LeaderboardCard";
import { useAdminAnalytics } from "@/lib/use-admin-analytics";

export default function AdminLeaderboardsPage() {
  const { data, loading } = useAdminAnalytics();

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const { leaderboards } = data;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Leaderboards" }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leaderboards</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Top performers across the platform, ranked from live activity.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LeaderboardCard title="🏆 Top Classes" description="By average submission rate." entries={leaderboards.topClassesBySubmissionRate} />
        <LeaderboardCard title="🏆 Top Teachers" description="By submissions received across their assignments." entries={leaderboards.topTeachersBySubmissions} />
        <LeaderboardCard title="🏆 Top Subjects" description="By average marks on graded submissions." entries={leaderboards.topSubjectsByAverageMarks} />
        <LeaderboardCard title="🏆 Top Students" description="By average score across graded submissions." entries={leaderboards.topStudentsByAverageScore} />
      </div>
    </div>
  );
}
