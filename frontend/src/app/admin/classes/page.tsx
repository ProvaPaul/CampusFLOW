"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Layers, BookOpen, AlertTriangle, TrendingUp } from "lucide-react";
import { classesApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ClassDto } from "@/lib/types";
import { useAdminAnalytics } from "@/lib/use-admin-analytics";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/Spinner";
import { SkeletonCard, SkeletonStatCard } from "@/components/ui/Skeleton";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { ClassCard } from "@/components/admin/ClassCard";

const classSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});
type ClassValues = z.infer<typeof classSchema>;

export default function AdminClassesPage() {
  const { data, loading, reload } = useAdminAnalytics();
  const [modalState, setModalState] = useState<{ mode: "create" } | { mode: "edit"; item: ClassDto } | null>(null);

  // Supports the global Quick Actions / Command Palette "Create class" shortcut (?new=1).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setModalState({ mode: "create" });
    }
  }, []);

  const handleDelete = async (item: ClassDto) => {
    if (!confirm(`Delete class "${item.name}"?`)) return;
    try {
      await classesApi.remove(item.id);
      toast.success("Class deleted");
      reload();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <StatCardGrid>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </StatCardGrid>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const classes = data.classes;
  const emptyClasses = classes.filter((c) => c.status === "Empty").length;
  const totalSubjectsAcrossClasses = classes.reduce((sum, c) => sum + c.totalSubjects, 0);
  const ratesWithData = classes.map((c) => c.averageSubmissionRate).filter((r): r is number => r !== null);
  const avgRate = ratesWithData.length > 0 ? Math.round(ratesWithData.reduce((a, b) => a + b, 0) / ratesWithData.length) : null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Classes / Courses</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage classes/courses and monitor how each one is doing.</p>
        </div>
        <Button onClick={() => setModalState({ mode: "create" })}>
          <Plus className="h-4 w-4" /> New class
        </Button>
      </div>

      <StatCardGrid className="mt-6">
        <StatCard icon={Layers} label="Total Classes" value={classes.length} />
        <StatCard icon={BookOpen} label="Subjects Across Classes" value={totalSubjectsAcrossClasses} />
        <StatCard icon={AlertTriangle} label="Classes Without Subjects" value={emptyClasses} tone={emptyClasses > 0 ? "warning" : "default"} />
        <StatCard icon={TrendingUp} label="Avg. Submission Rate" value={avgRate === null ? "No data" : `${avgRate}%`} />
      </StatCardGrid>

      {classes.length === 0 ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <EmptyState title="No classes yet" description="Create your first class/course." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {classes.map((insight) => (
            <ClassCard
              key={insight.classItem.id}
              insight={insight}
              onEdit={() => setModalState({ mode: "edit", item: insight.classItem })}
              onDelete={() => handleDelete(insight.classItem)}
            />
          ))}
        </div>
      )}

      {modalState && (
        <ClassFormModal
          initial={modalState.mode === "edit" ? modalState.item : undefined}
          onClose={() => setModalState(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}

function ClassFormModal({ initial, onClose, onSaved }: { initial?: ClassDto; onClose: () => void; onSaved: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClassValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: initial?.name ?? "", description: initial?.description ?? "" },
  });

  const onSubmit = async (values: ClassValues) => {
    try {
      if (initial) {
        await classesApi.update(initial.id, values);
        toast.success("Class updated");
      } else {
        await classesApi.create(values);
        toast.success("Class created");
      }
      onClose();
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title={initial ? "Edit class" : "Create class"} description="Classes group students and subjects together.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Name"
          required
          placeholder="e.g. Class 10 - Section A"
          hint={'Tip: add a section/semester after a dash, e.g. "BSc CSE - 3rd Semester" — used to infer academic level and section.'}
          error={errors.name?.message}
          {...register("name")}
        />
        <Textarea label="Description (optional)" {...register("description")} />
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
