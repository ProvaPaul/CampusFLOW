"use client";

import { useEffect, useState } from "react";
import { Users, Layers, BookOpen, ClipboardList } from "lucide-react";
import { assignmentsApi, classesApi, subjectsApi, usersApi } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface Stats {
  users: number;
  classes: number;
  subjects: number;
  assignments: number;
  publishedAssignments: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([usersApi.getAll(), classesApi.getAll(), subjectsApi.getAll(), assignmentsApi.getAll()]).then(
      ([users, classes, subjects, assignments]) => {
        setStats({
          users: users.length,
          classes: classes.length,
          subjects: subjects.length,
          assignments: assignments.length,
          publishedAssignments: assignments.filter((a) => a.status === "Published").length,
        });
      }
    );
  }, []);

  if (!stats) return <Spinner />;

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users },
    { label: "Classes / Courses", value: stats.classes, icon: Layers },
    { label: "Subjects", value: stats.subjects, icon: BookOpen },
    { label: "Assignments", value: `${stats.assignments} (${stats.publishedAssignments} published)`, icon: ClipboardList },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview of the CampusFlow platform.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardBody className="flex items-center gap-4">
              <div className="rounded-lg bg-indigo-50 p-2.5">
                <card.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{card.label}</p>
                <p className="text-lg font-semibold text-slate-900">{card.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardBody>
          <h2 className="text-sm font-semibold text-slate-900">Getting started</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
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
