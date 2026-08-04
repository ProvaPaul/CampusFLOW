"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { assignmentsApi, teacherAssignmentsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { TeacherAssignmentDto } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";

const schema = z.object({
  classId: z.string().min(1, "Select a class"),
  subjectId: z.string().min(1, "Select a subject"),
  title: z.string().min(3, "Title is required"),
  description: z.string().min(5, "Description is required"),
  deadline: z.string().min(1, "Deadline is required"),
  maxMarks: z.coerce.number().int().positive("Must be greater than 0"),
  allowResubmission: z.boolean(),
  publishImmediately: z.boolean(),
});
type FormValues = z.infer<typeof schema>;

export default function NewAssignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [myAssignments, setMyAssignments] = useState<TeacherAssignmentDto[] | null>(null);

  useEffect(() => {
    if (!user) return;
    teacherAssignmentsApi.getAll(user.id).then(setMyAssignments);
  }, [user]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { allowResubmission: true, publishImmediately: true, maxMarks: 100 },
  });

  const selectedClassId = watch("classId");

  const uniqueClasses = useMemo(() => {
    if (!myAssignments) return [];
    const map = new Map<string, string>();
    myAssignments.forEach((a) => map.set(a.classId, a.className));
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [myAssignments]);

  const subjectsForClass = useMemo(
    () => (myAssignments ?? []).filter((a) => a.classId === selectedClassId),
    [myAssignments, selectedClassId]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      const created = await assignmentsApi.create({
        ...values,
        deadline: new Date(values.deadline).toISOString(),
      });
      toast.success("Assignment created");
      router.push(`/teacher/assignments/${created.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!myAssignments) return <Spinner />;

  if (uniqueClasses.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You are not yet assigned to teach any subject/class. Ask an Admin to assign you to a subject before
            creating assignments.
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader title="Create assignment" description="Choose one of the subjects/classes you are assigned to teach." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Class" error={errors.classId?.message} {...register("classId")}>
            <option value="">Select a class</option>
            {uniqueClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Subject"
            hint={!selectedClassId ? "Select a class first" : undefined}
            error={errors.subjectId?.message}
            disabled={!selectedClassId}
            {...register("subjectId")}
          >
            <option value="">Select a subject</option>
            {subjectsForClass.map((a) => (
              <option key={a.subjectId} value={a.subjectId}>
                {a.subjectName}
              </option>
            ))}
          </Select>
          <Input label="Title" error={errors.title?.message} {...register("title")} />
          <Textarea label="Description / instructions" error={errors.description?.message} {...register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deadline" type="datetime-local" error={errors.deadline?.message} {...register("deadline")} />
            <Input label="Max marks" type="number" min={1} error={errors.maxMarks?.message} {...register("maxMarks")} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600 dark:bg-slate-800"
              {...register("allowResubmission")}
            />
            Allow students to update their submission before the deadline
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600 dark:bg-slate-800"
              {...register("publishImmediately")}
            />
            Publish immediately (uncheck to save as draft)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" loading={isSubmitting}>
              Create assignment
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
