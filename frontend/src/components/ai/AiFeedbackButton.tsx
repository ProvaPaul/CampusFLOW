"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Sparkles } from "lucide-react";
import { aiApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAiStatus } from "@/lib/use-ai-status";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";

export function AiFeedbackButton({
  assignmentTitle,
  answerText,
  marks,
  maxMarks,
  onSelect,
}: {
  assignmentTitle: string;
  answerText: string;
  marks: number | null;
  maxMarks: number;
  onSelect: (suggestion: string) => void;
}) {
  const { enabled, loading } = useAiStatus();
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [generating, setGenerating] = useState(false);

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const result = await aiApi.generateFeedback({ assignmentTitle, answerText, marks, maxMarks });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const button = (
    <Button type="button" variant="secondary" size="sm" disabled={!enabled || loading} loading={generating} onClick={onGenerate}>
      <Sparkles className="h-4 w-4" /> Suggest feedback
    </Button>
  );

  return (
    <div className="space-y-2">
      {!loading && !enabled ? (
        <Tooltip content="AI features aren't available — no API key is configured for this deployment.">
          <span tabIndex={0} className="inline-block cursor-not-allowed">
            {button}
          </span>
        </Tooltip>
      ) : (
        button
      )}

      {suggestions && suggestions.length > 0 && (
        <ul className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelect(s)}
                className="flex w-full items-start gap-2 rounded-md p-1.5 text-left text-xs text-slate-600 transition-colors hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
