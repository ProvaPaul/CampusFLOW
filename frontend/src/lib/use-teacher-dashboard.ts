"use client";

import { useCallback, useEffect, useState } from "react";
import { assignmentsApi, submissionsApi, teacherAssignmentsApi } from "./api";
import { useAuth } from "./auth-context";
import type { AssignmentDto } from "./types";

export interface TeacherDashboardData {
  assignments: AssignmentDto[];
  myClassCount: number;
  draftCount: number;
  publishedCount: number;
  pendingReviews: number;
  upcomingDeadlines: AssignmentDto[];
}

export function useTeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [assignments, teacherAssignments] = await Promise.all([assignmentsApi.getAll(), teacherAssignmentsApi.getAll(user.id)]);

    const withSubmissions = assignments.filter((a) => a.submissionCount > 0);
    const submissionLists = await Promise.all(withSubmissions.map((a) => submissionsApi.getByAssignment(a.id)));
    const pendingReviews = submissionLists.flat().filter((s) => s.status !== "Graded").length;

    const upcomingDeadlines = assignments
      .filter((a) => a.status === "Published" && new Date(a.deadline).getTime() > Date.now())
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 4);

    setData({
      assignments,
      myClassCount: new Set(teacherAssignments.map((ta) => ta.classId)).size,
      draftCount: assignments.filter((a) => a.status === "Draft").length,
      publishedCount: assignments.filter((a) => a.status === "Published").length,
      pendingReviews,
      upcomingDeadlines,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}
