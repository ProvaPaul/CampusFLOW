"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { assignmentsApi, submissionsApi } from "./api";
import type { SubmissionDto } from "./types";

export interface TeacherAnalyticsData {
  assignmentsCreated: number;
  published: number;
  draft: number;
  pendingReviews: number;
  averageGradingHours: number | null;
  submissionTrend: Array<{ date: string; submissions: number }>;
}

export function useTeacherAnalytics() {
  const [data, setData] = useState<TeacherAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const assignments = await assignmentsApi.getAll();
    const withSubmissions = assignments.filter((a) => a.submissionCount > 0);
    const submissionLists = await Promise.all(withSubmissions.map((a) => submissionsApi.getByAssignment(a.id)));
    const allSubmissions: SubmissionDto[] = submissionLists.flat();

    const pendingReviews = allSubmissions.filter((s) => s.status !== "Graded").length;
    const gradingHours = allSubmissions
      .filter((s) => s.status === "Graded" && s.gradedAt)
      .map((s) => (new Date(s.gradedAt!).getTime() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60));

    const now = new Date();
    const trendDays = new Map<string, { label: string; count: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = subDays(now, i);
      trendDays.set(d.toDateString(), { label: format(d, "MMM d"), count: 0 });
    }
    allSubmissions.forEach((s) => {
      const bucket = trendDays.get(new Date(s.submittedAt).toDateString());
      if (bucket) bucket.count += 1;
    });

    setData({
      assignmentsCreated: assignments.length,
      published: assignments.filter((a) => a.status === "Published").length,
      draft: assignments.filter((a) => a.status === "Draft").length,
      pendingReviews,
      averageGradingHours:
        gradingHours.length > 0 ? Math.round((gradingHours.reduce((sum, h) => sum + h, 0) / gradingHours.length) * 10) / 10 : null,
      submissionTrend: Array.from(trendDays.values()).map((v) => ({ date: v.label, submissions: v.count })),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}
