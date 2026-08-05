"use client";

import { useCallback, useEffect, useState } from "react";
import { assignmentsApi, classesApi, submissionsApi, usersApi } from "./api";
import { computePlatformAnalytics, type PlatformAnalytics } from "./platform-analytics";
import type { SubmissionDto } from "./types";

export function usePlatformAnalytics() {
  const [data, setData] = useState<PlatformAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [classes, users, assignments] = await Promise.all([classesApi.getAll(), usersApi.getAll(), assignmentsApi.getAll()]);

    const assignmentsWithSubmissions = assignments.filter((a) => a.submissionCount > 0);
    const submissionEntries = await Promise.all(
      assignmentsWithSubmissions.map(async (a): Promise<[string, SubmissionDto[]]> => [a.id, await submissionsApi.getByAssignment(a.id)])
    );
    const submissionsByAssignment = Object.fromEntries(submissionEntries);

    setData(computePlatformAnalytics({ classes, users, assignments, submissionsByAssignment }));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, reload: load };
}
