import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { QuickInsights as QuickInsightsData } from "@/lib/admin-analytics";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

function InsightCard({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader title={`${emoji} ${title}`} />
      <CardBody className="text-sm text-slate-600 dark:text-slate-400">{children}</CardBody>
    </Card>
  );
}

function Placeholder({ text }: { text: string }) {
  return <p className="text-slate-400 dark:text-slate-500">{text}</p>;
}

export function QuickInsights({ data }: { data: QuickInsightsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <InsightCard title="Most Active Subject" emoji="📈">
        {data.mostActiveSubject ? (
          <>
            <p className="font-medium text-slate-900 dark:text-slate-100">{data.mostActiveSubject.subject.name}</p>
            <p>{data.mostActiveSubject.submissions} total submission(s)</p>
          </>
        ) : (
          <Placeholder text="Not enough submission data yet." />
        )}
      </InsightCard>

      <InsightCard title="Class with Highest Submission Rate" emoji="🏆">
        {data.topSubmissionRateClass ? (
          <>
            <p className="font-medium text-slate-900 dark:text-slate-100">{data.topSubmissionRateClass.classItem.name}</p>
            <p>{data.topSubmissionRateClass.rate}% average submission rate</p>
          </>
        ) : (
          <Placeholder text="Not enough submission data yet." />
        )}
      </InsightCard>

      <InsightCard title="Upcoming Assignment Deadlines" emoji="⏰">
        {data.upcomingDeadlines.length === 0 ? (
          <Placeholder text="No upcoming deadlines." />
        ) : (
          <ul className="space-y-1.5">
            {data.upcomingDeadlines.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/assignments?subjectId=${a.subjectId}`} className="truncate text-indigo-600 hover:underline dark:text-indigo-400">
                  {a.title}
                </Link>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatDate(a.deadline)}</span>
              </li>
            ))}
          </ul>
        )}
      </InsightCard>

      <InsightCard title="Subjects Without Assigned Teachers" emoji="⚠️">
        {data.subjectsWithoutTeacher.length === 0 ? (
          <p className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">All subjects are staffed.</p>
        ) : (
          <ul className="space-y-1">
            {data.subjectsWithoutTeacher.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <Link href="/admin/teacher-assignments" className="truncate hover:underline">
                  {s.name} ({s.className})
                </Link>
              </li>
            ))}
          </ul>
        )}
      </InsightCard>

      <InsightCard title="Classes Without Subjects" emoji="⚠️">
        {data.classesWithoutSubjects.length === 0 ? (
          <p className="text-emerald-600 dark:text-emerald-400">Every class has at least one subject.</p>
        ) : (
          <ul className="space-y-1">
            {data.classesWithoutSubjects.map((c) => (
              <li key={c.id} className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <Link href="/admin/subjects" className="truncate hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </InsightCard>

      <InsightCard title="Draft Assignments Waiting to be Published" emoji="📄">
        {data.draftAssignments.length === 0 ? (
          <Placeholder text="No drafts waiting." />
        ) : (
          <ul className="space-y-1.5">
            {data.draftAssignments.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/assignments?status=Draft`} className="truncate text-indigo-600 hover:underline dark:text-indigo-400">
                  {a.title}
                </Link>
                <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">{a.teacherName}</span>
              </li>
            ))}
            {data.draftAssignments.length > 5 && (
              <li className="text-xs text-slate-400 dark:text-slate-500">+{data.draftAssignments.length - 5} more</li>
            )}
          </ul>
        )}
      </InsightCard>
    </div>
  );
}
