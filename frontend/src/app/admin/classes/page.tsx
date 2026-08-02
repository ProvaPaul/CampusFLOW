"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { classesApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ClassDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState, Spinner } from "@/components/ui/Spinner";

const classSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional(),
});
type ClassValues = z.infer<typeof classSchema>;

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassDto[] | null>(null);
  const [modalState, setModalState] = useState<{ mode: "create" } | { mode: "edit"; item: ClassDto } | null>(null);

  const load = () => classesApi.getAll().then(setClasses);

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (item: ClassDto) => {
    if (!confirm(`Delete class "${item.name}"?`)) return;
    try {
      await classesApi.remove(item.id);
      toast.success("Class deleted");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!classes) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Classes / Courses</h1>
          <p className="mt-1 text-sm text-slate-500">Manage the classes/courses offered.</p>
        </div>
        <Button onClick={() => setModalState({ mode: "create" })}>
          <Plus className="h-4 w-4" /> New class
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        {classes.length === 0 ? (
          <EmptyState title="No classes yet" description="Create your first class/course." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {classes.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  {item.description && <p className="text-sm text-slate-500">{item.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setModalState({ mode: "edit", item })} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modalState && (
        <ClassFormModal
          initial={modalState.mode === "edit" ? modalState.item : undefined}
          onClose={() => setModalState(null)}
          onSaved={load}
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
    <Modal open onClose={onClose} title={initial ? "Edit class" : "Create class"}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" placeholder="e.g. Class 10 - Section A" error={errors.name?.message} {...register("name")} />
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
