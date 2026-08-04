import Link from "next/link";
import { GraduationCap, UserCheck, Users, BookOpen, CheckCircle2, FileClock, Pencil, Trash2, ArrowRight } from "lucide-react";
import type { ClassInsight } from "@/lib/admin-analytics";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { entityStatusStyles, formatRelative } from "@/lib/utils";

function MiniStat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
      <span className="font-medium text-slate-800 dark:text-slate-200">{value}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

export function ClassCard({
  insight,
  onEdit,
  onDelete,
}: {
  insight: ClassInsight;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { classItem } = insight;

  return (
    <Card className="flex h-full flex-col">
      <CardBody className="flex-1 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{classItem.name}</h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500 dark:text-slate-400">
              <GraduationCap className="h-3 w-3 shrink-0" /> {insight.academicLevel} · {insight.sectionLabel}
            </p>
          </div>
          <Badge className={entityStatusStyles[insight.status]}>{insight.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <MiniStat icon={Users} label="students" value={insight.totalStudents} />
          <MiniStat icon={BookOpen} label="subjects" value={insight.totalSubjects} />
          <MiniStat icon={UserCheck} label="teachers" value={insight.assignedTeachers} />
          <MiniStat icon={CheckCircle2} label="active" value={insight.activeAssignments} />
        </div>

        {insight.pendingAssignments > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <FileClock className="h-3.5 w-3.5 shrink-0" />
            {insight.pendingAssignments} draft assignment(s) waiting to be published
          </p>
        )}

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Average submission rate</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {insight.averageSubmissionRate === null ? "No data yet" : `${insight.averageSubmissionRate}%`}
            </span>
          </div>
          <ProgressBar value={insight.averageSubmissionRate ?? 0} />
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          {insight.lastActivity ? `Last activity ${formatRelative(insight.lastActivity)}` : "No activity yet"}
        </p>
      </CardBody>

      <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <Link
          href={`/admin/assignments?classId=${classItem.id}`}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          View assignments <ArrowRight className="h-3 w-3" />
        </Link>
        <div className="flex gap-1">
          <button onClick={onEdit} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}
