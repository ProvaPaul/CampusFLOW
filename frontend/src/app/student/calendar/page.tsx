"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function StudentCalendarPage() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "My Assignments", href: "/student" }, { label: "Calendar" }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Academic Calendar</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your upcoming deadlines plus school-wide exams, holidays, and meetings.</p>
      </div>
      <CalendarView assignmentBasePath="/student/assignments" />
    </div>
  );
}
