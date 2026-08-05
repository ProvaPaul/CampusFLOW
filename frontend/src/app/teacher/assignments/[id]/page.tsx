"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { assignmentsApi, submissionsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { AssignmentDto, SubmissionDto, SubmissionStatus } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SkeletonCard, SkeletonTable } from "@/components/ui/Skeleton";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SubmissionsTable } from "@/components/shared/SubmissionsTable";
import { AiFeedbackButton } from "@/components/ai/AiFeedbackButton";
import { assignmentStatusStyles, formatDate } from "@/lib/utils";

const editSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(5, "Description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  maxMarks: z.coerce.number().int().positive("Must be greater than 0"),
  allowResubmission: z.boolean(),
});
type EditValues = z.infer<typeof editSchema>;

export default function TeacherAssignmentDetailPage() {
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDto[] | null>(null);
  const [grading, setGrading] = useState<SubmissionDto | null>(null);

  const load = useCallback(async () => {
    const [a, subs] = await Promise.all([
      assignmentsApi.getById(params.id),
      submissionsApi.getByAssignment(params.id),
    ]);
    setAssignment(a);
    setSubmissions(subs);
  }, [params.id]);

  useEffect(() => {
    load();
  }, [load]);

  const togglePublish = async () => {
    if (!assignment) return;
    try {
      const updated = await assignmentsApi.updateStatus(assignment.id, assignment.status === "Draft" ? "Published" : "Draft");
      setAssignment(updated);
      toast.success(updated.status === "Published" ? "Assignment published" : "Reverted to draft");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleStatusChange = async (submission: SubmissionDto, status: SubmissionStatus) => {
    try {
      const updated = await submissionsApi.updateStatus(submission.id, status);
      setSubmissions((prev) => prev!.map((s) => (s.id === updated.id ? updated : s)));
      toast.success("Submission status updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!assignment || !submissions) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonTable columns={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "My Assignments", href: "/teacher" }, { label: assignment.title }]} />
      <Card>
        <CardHeader
          title={assignment.title}
          description={`${assignment.subjectName} · ${assignment.className}`}
          action={
            <div className="flex items-center gap-2">
              <Badge className={assignmentStatusStyles[assignment.status]}>{assignment.status}</Badge>
              <Button size="sm" variant="secondary" onClick={togglePublish}>
                {assignment.status === "Draft" ? "Publish" : "Revert to draft"}
              </Button>
            </div>
          }
        />
        <CardBody>
          <EditAssignmentForm assignment={assignment} onSaved={load} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Submissions" description={`${submissions.length} student(s) have submitted.`} />
        <SubmissionsTable
          submissions={submissions}
          onStatusChange={handleStatusChange}
          renderActions={(s) => (
            <Button size="sm" variant="secondary" onClick={() => setGrading(s)}>
              View &amp; grade
            </Button>
          )}
        />
      </Card>

      {grading && (
        <GradeModal
          submission={grading}
          onClose={() => setGrading(null)}
          onGraded={(updated) => {
            setSubmissions((prev) => prev!.map((s) => (s.id === updated.id ? updated : s)));
            setGrading(null);
          }}
        />
      )}
    </div>
  );
}

function EditAssignmentForm({ assignment, onSaved }: { assignment: AssignmentDto; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      title: assignment.title,
      description: assignment.description,
      deadline: toLocalInput(assignment.deadline),
      maxMarks: assignment.maxMarks,
      allowResubmission: assignment.allowResubmission,
    },
  });

  const onSubmit = async (values: EditValues) => {
    try {
      await assignmentsApi.update(assignment.id, { ...values, deadline: new Date(values.deadline).toISOString() });
      toast.success("Assignment updated");
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title" required error={errors.title?.message} {...register("title")} />
      <Textarea label="Description / instructions" required error={errors.description?.message} {...register("description")} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Deadline" type="datetime-local" required error={errors.deadline?.message} {...register("deadline")} />
        <Input label="Max marks" type="number" min={1} required error={errors.maxMarks?.message} {...register("maxMarks")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600 dark:bg-slate-800"
          {...register("allowResubmission")}
        />
        Allow students to update their submission before the deadline
      </label>
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={isSubmitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

function GradeModal({
  submission,
  onClose,
  onGraded,
}: {
  submission: SubmissionDto;
  onClose: () => void;
  onGraded: (updated: SubmissionDto) => void;
}) {
  const gradeSchema = z.object({
    marks: z
      .string()
      .min(1, "Marks is required")
      .refine((v) => !Number.isNaN(Number(v)), "Marks must be a number")
      .refine((v) => Number(v) >= 0, "Marks cannot be negative")
      .refine((v) => Number(v) <= submission.maxMarks, `Marks cannot exceed ${submission.maxMarks}`),
    feedback: z.string().optional(),
  });
  type GradeValues = z.infer<typeof gradeSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GradeValues>({
    resolver: zodResolver(gradeSchema),
    defaultValues: { marks: submission.marks != null ? String(submission.marks) : "", feedback: submission.feedback ?? "" },
  });

  const marksValue = watch("marks");
  const feedbackValue = watch("feedback");

  const onSubmit = async (values: GradeValues) => {
    try {
      const updated = await submissionsApi.grade(submission.id, { marks: Number(values.marks), feedback: values.feedback });
      toast.success("Grade saved");
      onGraded(updated);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Grade — ${submission.studentName}`} description="Marks and feedback are visible to the student immediately.">
      <div className="mb-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap dark:bg-slate-800 dark:text-slate-300">{submission.answerText}</div>
      {submission.attachmentUrl && (
        <a href={submission.attachmentUrl} target="_blank" rel="noreferrer" className="mb-4 block text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          View attachment
        </a>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={`Marks (out of ${submission.maxMarks})`}
          type="number"
          min={0}
          max={submission.maxMarks}
          required
          error={errors.marks?.message}
          {...register("marks")}
        />
        <Textarea label="Feedback" error={errors.feedback?.message} {...register("feedback")} />
        <AiFeedbackButton
          assignmentTitle={submission.assignmentTitle}
          answerText={submission.answerText}
          marks={marksValue ? Number(marksValue) : null}
          maxMarks={submission.maxMarks}
          onSelect={(suggestion) => setValue("feedback", feedbackValue ? `${feedbackValue}\n${suggestion}` : suggestion, { shouldValidate: true })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save grade
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}
