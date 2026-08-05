"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { CheckCircle2 } from "lucide-react";
import { assignmentsApi, submissionsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { AssignmentDto, SubmissionDto } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { assignmentStatusStyles, formatDate, isDeadlinePassed, submissionStatusStyles } from "@/lib/utils";

const schema = z.object({
  answerText: z.string().min(1, "Your answer cannot be empty"),
  attachmentUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function StudentAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submission, setSubmission] = useState<SubmissionDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const a = await assignmentsApi.getById(params.id);
    setAssignment(a);
    if (a.mySubmission) {
      const s = await submissionsApi.getById(a.mySubmission.id);
      setSubmission(s);
    } else {
      setSubmission(null);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (submission) {
      reset({ answerText: submission.answerText, attachmentUrl: submission.attachmentUrl ?? "" });
    }
  }, [submission, reset]);

  const onSubmit = async (values: FormValues) => {
    if (!assignment) return;
    const payload = { answerText: values.answerText, attachmentUrl: values.attachmentUrl || null };
    try {
      if (submission) {
        await submissionsApi.update(submission.id, payload);
        toast.success("Submission updated");
      } else {
        await submissionsApi.submit(assignment.id, payload);
        toast.success("Assignment submitted");
      }
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading || !assignment) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const deadlinePassed = isDeadlinePassed(assignment.deadline);
  const canEdit = !submission || (assignment.allowResubmission && !deadlinePassed && submission.status !== "Graded");
  const isGraded = submission?.status === "Graded";

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "My Assignments", href: "/student" }, { label: assignment.title }]} />
      <Card>
        <CardHeader
          title={assignment.title}
          description={`${assignment.subjectName} · ${assignment.className}`}
          action={<Badge className={assignmentStatusStyles[assignment.status]}>{assignment.status}</Badge>}
        />
        <CardBody className="space-y-3">
          <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{assignment.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
            <span className={deadlinePassed ? "font-medium text-red-600 dark:text-red-400" : ""}>Deadline: {formatDate(assignment.deadline)}</span>
            <span>Max marks: {assignment.maxMarks}</span>
            <span>{assignment.allowResubmission ? "Resubmission allowed before deadline" : "Resubmission not allowed"}</span>
          </div>
        </CardBody>
      </Card>

      {isGraded && submission && (
        <Card>
          <CardHeader title="Your grade" action={<Badge className={submissionStatusStyles[submission.status]}>{submission.status}</Badge>} />
          <CardBody className="space-y-2">
            <p className="flex items-center gap-2 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              {submission.marks} / {submission.maxMarks}
            </p>
            {submission.feedback && <p className="text-sm text-slate-700 dark:text-slate-300">{submission.feedback}</p>}
            <p className="text-xs text-slate-400 dark:text-slate-500">Graded {submission.gradedAt && formatDate(submission.gradedAt)}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title={submission ? "Your submission" : "Submit your answer"}
          action={submission && <Badge className={submissionStatusStyles[submission.status]}>{submission.status}</Badge>}
        />
        <CardBody>
          {canEdit ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Textarea label="Your answer" required rows={6} error={errors.answerText?.message} {...register("answerText")} />
              <Input label="Attachment URL (optional)" placeholder="https://..." error={errors.attachmentUrl?.message} {...register("attachmentUrl")} />
              <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting}>
                  {submission ? "Update submission" : "Submit assignment"}
                </Button>
              </div>
            </form>
          ) : submission ? (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{submission.answerText}</p>
              {submission.attachmentUrl && (
                <a
                  href={submission.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View attachment
                </a>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500">Submitted {formatDate(submission.submittedAt)}</p>
              {!isGraded && <p className="text-xs text-amber-600 dark:text-amber-400">This submission can no longer be edited.</p>}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">The deadline for this assignment has passed.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
