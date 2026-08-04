import { BookOpen, CheckCircle2, FilePlus, Inbox, Layers, Megaphone, UserCheck, type LucideIcon } from "lucide-react";
import type { ActivityEvent, ActivityType } from "@/lib/admin-analytics";
import { formatRelative } from "@/lib/utils";
import { EmptyState } from "@/components/ui/Spinner";

const iconByType: Record<ActivityType, LucideIcon> = {
  class_created: Layers,
  subject_created: BookOpen,
  teacher_assigned: UserCheck,
  assignment_created: FilePlus,
  assignment_published: Megaphone,
  submission_received: Inbox,
  submission_graded: CheckCircle2,
};

export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <EmptyState title="No recent activity" description="Activity will appear here as the platform is used." />;
  }

  return (
    <ul className="space-y-4">
      {events.map((event) => {
        const Icon = iconByType[event.type];
        return (
          <li key={event.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-700 dark:text-slate-300">{event.text}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(event.date)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
