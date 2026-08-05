"use client";

import { useEffect, useState } from "react";
import { aiApi } from "./api";

/** Whether the backend has an AI provider key configured — gates every AI-powered action in the UI. */
export function useAiStatus() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiApi
      .status()
      .then((s) => setEnabled(s.enabled))
      .catch(() => setEnabled(false))
      .finally(() => setLoading(false));
  }, []);

  return { enabled, loading };
}
