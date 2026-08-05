"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { aiApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAiStatus } from "@/lib/use-ai-status";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Tooltip } from "@/components/ui/Tooltip";
import type { GeneratedAssignmentDto } from "@/lib/types";

const promptSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topic: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  maxMarks: z.coerce.number().int().positive("Must be greater than 0"),
  learningObjective: z.string().min(1, "Learning objective is required"),
});
type PromptValues = z.infer<typeof promptSchema>;

export function AiGenerateAssignmentButton({
  defaultSubject,
  defaultMaxMarks,
  onApply,
}: {
  defaultSubject?: string;
  defaultMaxMarks?: number;
  onApply: (generated: GeneratedAssignmentDto) => void;
}) {
  const { enabled, loading } = useAiStatus();
  const [open, setOpen] = useState(false);
  const [generated, setGenerated] = useState<GeneratedAssignmentDto | null>(null);
  const [generating, setGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromptValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: { difficulty: "Medium", maxMarks: defaultMaxMarks ?? 100, subject: defaultSubject ?? "" },
  });

  const { register: registerReview, handleSubmit: handleReviewSubmit, reset: resetReview } = useForm<GeneratedAssignmentDto>();

  const closeAndReset = () => {
    setOpen(false);
    setGenerated(null);
  };

  const onGenerate = async (values: PromptValues) => {
    setGenerating(true);
    try {
      const result = await aiApi.generateAssignment(values);
      setGenerated(result);
      resetReview(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setGenerating(false);
    }
  };

  const onApplyReview = (values: GeneratedAssignmentDto) => {
    onApply(values);
    closeAndReset();
    toast.success("AI draft applied — review before publishing.");
  };

  const button = (
    <Button type="button" variant="secondary" size="sm" disabled={!enabled || loading} onClick={() => setOpen(true)}>
      <Sparkles className="h-4 w-4" /> Generate with AI
    </Button>
  );

  return (
    <>
      {!loading && !enabled ? (
        <Tooltip content="AI features aren't available — no API key is configured for this deployment.">
          <span tabIndex={0} className="inline-block cursor-not-allowed">
            {button}
          </span>
        </Tooltip>
      ) : (
        button
      )}

      <Modal open={open} onClose={closeAndReset} title="AI Assignment Generator" description="Describe what you want, then review and edit before applying.">
        {!generated ? (
          <form onSubmit={handleSubmit(onGenerate)} className="space-y-4">
            <Input label="Subject" required error={errors.subject?.message} {...register("subject")} />
            <Input label="Topic" required error={errors.topic?.message} {...register("topic")} />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Difficulty" required {...register("difficulty")}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </Select>
              <Input label="Maximum marks" type="number" min={1} required error={errors.maxMarks?.message} {...register("maxMarks")} />
            </div>
            <Textarea label="Learning objective" required error={errors.learningObjective?.message} {...register("learningObjective")} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={closeAndReset}>
                Cancel
              </Button>
              <Button type="submit" loading={generating}>
                <Sparkles className="h-4 w-4" /> Generate
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleReviewSubmit(onApplyReview)} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Review and edit the AI-generated draft below before applying it.</p>
            <Input label="Title" {...registerReview("title")} />
            <Textarea label="Description" rows={3} {...registerReview("description")} />
            <Textarea label="Requirements" rows={3} {...registerReview("requirements")} />
            <Textarea label="Instructions" rows={3} {...registerReview("instructions")} />
            <Textarea label="Expected outcome" rows={2} {...registerReview("expectedOutcome")} />
            <Textarea label="Grading rubric" rows={3} {...registerReview("gradingRubric")} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setGenerated(null)}>
                Back
              </Button>
              <Button type="submit">Apply to assignment</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
