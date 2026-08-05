"use client";

import { useCallback, useEffect, useState } from "react";
import { assignmentsApi, submissionsApi } from "./api";
import type { AssignmentDto, SubmissionDto } from "./types";

export interface StudentDashboardData {
  assignments: AssignmentDto[];
  mySubmissions: SubmissionDto[];
  upcoming: AssignmentDto[];
  recentlySubmitted: SubmissionDto[];
  gradedSubmissions: SubmissionDto[];
  pendingCount: number;
}

export function useStudentDashboard() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [assignments, mySubmissions] = await Promise.all([assignmentsApi.getAll(), submissionsApi.getMy()]);

    const upcoming = assignments
      .filter((a) => !a.mySubmission && new Date(a.deadline).getTime() > Date.now())
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 4);

    const recentlySubmitted = [...mySubmissions].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 4);
    const gradedSubmissions = mySubmissions.filter((s) => s.status === "Graded");
    const pendingCount = assignments.filter((a) => !a.mySubmission && new Date(a.deadline).getTime() > Date.now()).length;

    setData({ assignments, mySubmissions, upcoming, recentlySubmitted, gradedSubmissions, pendingCount });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}
