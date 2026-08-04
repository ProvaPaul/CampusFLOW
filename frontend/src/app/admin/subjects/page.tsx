"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, BookOpen, AlertTriangle, ClipboardList, TrendingUp } from "lucide-react";
import { subjectsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { SubjectDto } from "@/lib/types";
import { useAdminAnalytics } from "@/lib/use-admin-analytics";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, Spinner } from "@/components/ui/Spinner";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { SubjectCard } from "@/components/admin/SubjectCard";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  classId: z.string().min(1, "Select a class"),
});
const updateSchema = createSchema.omit({ classId: true });

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;

export default function AdminSubjectsPage() {
  const { data, loading, reload } = useAdminAnalytics();
  const [modalState, setModalState] = useState<{ mode: "create" } | { mode: "edit"; item: SubjectDto } | null>(null);

  const handleDelete = async (item: SubjectDto) => {
    if (!confirm(`Delete subject "${item.name}"?`)) return;
    try {
      await subjectsApi.remove(item.id);
      toast.success("Subject deleted");
      reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading || !data) return <Spinner />;

  const classes = data.classes.map((c) => c.classItem);
  const subjects = data.subjects;
  const needingTeacher = subjects.filter((s) => s.status === "Needs Teacher").length;
  const totalAssignments = subjects.reduce((sum, s) => sum + s.assignmentsCount, 0);
  const ratesWithData = subjects.map((s) => s.submissionRate).filter((r): r is number => r !== null);
  const avgRate = ratesWithData.length > 0 ? Math.round(ratesWithData.reduce((a, b) => a + b, 0) / ratesWithData.length) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Subjects</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage subjects and monitor how each one is performing.</p>
        </div>
        <Button onClick={() => setModalState({ mode: "create" })} disabled={classes.length === 0}>
          <Plus className="h-4 w-4" /> New subject
        </Button>
      </div>

      {classes.length === 0 && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">Create a class first before adding subjects.</p>
      )}

      <StatCardGrid className="mt-6">
        <StatCard icon={BookOpen} label="Total Subjects" value={subjects.length} />
        <StatCard icon={AlertTriangle} label="Without a Teacher" value={needingTeacher} tone={needingTeacher > 0 ? "warning" : "default"} />
        <StatCard icon={ClipboardList} label="Assignments Across Subjects" value={totalAssignments} />
        <StatCard icon={TrendingUp} label="Avg. Submission Rate" value={avgRate === null ? "No data" : `${avgRate}%`} />
      </StatCardGrid>

      {subjects.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <EmptyState title="No subjects yet" description="Create your first subject." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((insight) => (
            <SubjectCard
              key={insight.subject.id}
              insight={insight}
              onEdit={() => setModalState({ mode: "edit", item: insight.subject })}
              onDelete={() => handleDelete(insight.subject)}
            />
          ))}
        </div>
      )}

      {modalState?.mode === "create" && (
        <CreateSubjectModal classes={classes.map((c) => ({ id: c.id, name: c.name }))} onClose={() => setModalState(null)} onSaved={reload} />
      )}
      {modalState?.mode === "edit" && (
        <EditSubjectModal item={modalState.item} onClose={() => setModalState(null)} onSaved={reload} />
      )}
    </div>
  );
}

function CreateSubjectModal({
  classes,
  onClose,
  onSaved,
}: {
  classes: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateValues>({ resolver: zodResolver(createSchema) });

  const onSubmit = async (values: CreateValues) => {
    try {
      await subjectsApi.create(values);
      toast.success("Subject created");
      onClose();
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title="Create subject">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" placeholder="e.g. Mathematics" error={errors.name?.message} {...register("name")} />
        <Input label="Code" placeholder="e.g. MATH101" error={errors.code?.message} {...register("code")} />
        <Select label="Class" error={errors.classId?.message} {...register("classId")}>
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditSubjectModal({ item, onClose, onSaved }: { item: SubjectDto; onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateValues>({ resolver: zodResolver(updateSchema), defaultValues: { name: item.name, code: item.code } });

  const onSubmit = async (values: UpdateValues) => {
    try {
      await subjectsApi.update(item.id, values);
      toast.success("Subject updated");
      onClose();
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title="Edit subject">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Code" error={errors.code?.message} {...register("code")} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
