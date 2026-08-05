"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Calendar" }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Academic Calendar</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Assignment deadlines across the platform, plus exams, holidays, and meetings you schedule.
        </p>
      </div>
      <CalendarView assignmentBasePath="/admin/assignments" />
    </div>
  );
}
