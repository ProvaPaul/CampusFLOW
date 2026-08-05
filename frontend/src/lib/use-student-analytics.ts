"use client";

import { useCallback, useEffect, useState } from "react";
import { assignmentsApi, submissionsApi } from "./api";

export interface StudentAnalyticsData {
  averageScore: number | null;
  submissionRate: number | null;
  lateCount: number;
  totalSubmitted: number;
  totalAvailable: number;
  gradedCount: number;
}

export function useStudentAnalytics() {
  const [data, setData] = useState<StudentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [assignments, submissions] = await Promise.all([assignmentsApi.getAll(), submissionsApi.getMy()]);

    const graded = submissions.filter((s) => s.status === "Graded" && s.marks !== null);
    const averageScore =
      graded.length > 0 ? Math.round(graded.reduce((sum, s) => sum + (s.marks! / s.maxMarks) * 100, 0) / graded.length) : null;

    const totalAvailable = assignments.length;
    const submissionRate = totalAvailable > 0 ? Math.min(100, Math.round((submissions.length / totalAvailable) * 100)) : null;
    const lateCount = submissions.filter((s) => s.status === "Late").length;

    setData({
      averageScore,
      submissionRate,
      lateCount,
      totalSubmitted: submissions.length,
      totalAvailable,
      gradedCount: graded.length,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}
