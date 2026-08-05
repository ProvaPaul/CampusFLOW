import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { SmartInsights } from "@/lib/admin-analytics";
import { InsightCard, Placeholder } from "@/components/admin/QuickInsights";
import { formatDate } from "@/lib/utils";

export function SmartAdminInsights({ data }: { data: SmartInsights }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <InsightCard title="Most Active Class" emoji="🏆">
        {data.mostActiveClass ? (
          <>
            <p className="font-medium text-slate-900 dark:text-slate-100">{data.mostActiveClass.classItem.name}</p>
            <p>{data.mostActiveClass.submissions} total submission(s)</p>
          </>
        ) : (
          <Placeholder text="Not enough submission data yet." />
        )}
      </InsightCard>

      <InsightCard title="Most Active Teacher" emoji="🏆">
        {data.mostActiveTeacher ? (
          <>
            <p className="font-medium text-slate-900 dark:text-slate-100">{data.mostActiveTeacher.teacherName}</p>
            <p>{data.mostActiveTeacher.submissions} submission(s) received</p>
          </>
        ) : (
          <Placeholder text="Not enough submission data yet." />
        )}
      </InsightCard>

      <InsightCard title="Low Submission-Rate Classes" emoji="⚠️">
        {data.lowSubmissionRateClasses.length === 0 ? (
          <p className="text-emerald-600 dark:text-emerald-400">No class is currently below the 40% submission threshold.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.lowSubmissionRateClasses.slice(0, 5).map(({ classItem, rate }) => (
              <li key={classItem.id} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 truncate">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {classItem.name}
                </span>
                <span className="shrink-0 text-xs font-medium text-amber-600 dark:text-amber-400">{rate}%</span>
              </li>
            ))}
          </ul>
        )}
      </InsightCard>

      <InsightCard title="Overdue Drafts" emoji="⚠️">
        {data.overdueDraftAssignments.length === 0 ? (
          <p className="text-emerald-600 dark:text-emerald-400">No drafts have missed their deadline.</p>
        ) : (
          <ul className="space-y-1.5">
            {data.overdueDraftAssignments.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/assignments?status=Draft`} className="truncate text-indigo-600 hover:underline dark:text-indigo-400">
                  {a.title}
                </Link>
                <span className="shrink-0 text-xs text-red-500 dark:text-red-400">was due {formatDate(a.deadline)}</span>
              </li>
            ))}
            {data.overdueDraftAssignments.length > 5 && (
              <li className="text-xs text-slate-400 dark:text-slate-500">+{data.overdueDraftAssignments.length - 5} more</li>
            )}
          </ul>
        )}
      </InsightCard>
    </div>
  );
}
