"use client";

import { useCallback, useEffect, useState } from "react";
import { assignmentsApi, classesApi, subjectsApi, teacherAssignmentsApi, usersApi, submissionsApi } from "./api";
import { computeAdminAnalytics, type AdminAnalytics } from "./admin-analytics";
import type { SubmissionDto } from "./types";

export function useAdminAnalytics() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [classes, subjects, users, teacherAssignments, assignments] = await Promise.all([
      classesApi.getAll(),
      subjectsApi.getAll(),
      usersApi.getAll(),
      teacherAssignmentsApi.getAll(),
      assignmentsApi.getAll(),
    ]);

    // Only fetch submission details for assignments that actually have submissions —
    // submissionCount (already on AssignmentDto) tells us that without an extra call.
    const assignmentsWithSubmissions = assignments.filter((a) => a.submissionCount > 0);
    const submissionEntries = await Promise.all(
      assignmentsWithSubmissions.map(
        async (a): Promise<[string, SubmissionDto[]]> => [a.id, await submissionsApi.getByAssignment(a.id)]
      )
    );
    const submissionsByAssignment = Object.fromEntries(submissionEntries);

    setData(computeAdminAnalytics({ classes, subjects, users, teacherAssignments, assignments, submissionsByAssignment }));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}
