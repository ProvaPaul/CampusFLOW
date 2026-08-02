"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { classesApi, subjectsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ClassDto, SubjectDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, Spinner } from "@/components/ui/Spinner";

const createSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required"),
  classId: z.string().min(1, "Select a class"),
});
const updateSchema = createSchema.omit({ classId: true });

type CreateValues = z.infer<typeof createSchema>;
type UpdateValues = z.infer<typeof updateSchema>;

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectDto[] | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [modalState, setModalState] = useState<{ mode: "create" } | { mode: "edit"; item: SubjectDto } | null>(null);

  const load = async () => {
    const [subjectList, classList] = await Promise.all([subjectsApi.getAll(), classesApi.getAll()]);
    setSubjects(subjectList);
    setClasses(classList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (item: SubjectDto) => {
    if (!confirm(`Delete subject "${item.name}"?`)) return;
    try {
      await subjectsApi.remove(item.id);
      toast.success("Subject deleted");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!subjects) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Subjects</h1>
          <p className="mt-1 text-sm text-slate-500">Manage subjects offered within each class/course.</p>
        </div>
        <Button onClick={() => setModalState({ mode: "create" })} disabled={classes.length === 0}>
          <Plus className="h-4 w-4" /> New subject
        </Button>
      </div>

      {classes.length === 0 && (
        <p className="mt-3 text-sm text-amber-600">Create a class first before adding subjects.</p>
      )}

      <Card className="mt-6 overflow-hidden">
        {subjects.length === 0 ? (
          <EmptyState title="No subjects yet" description="Create your first subject." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Name", "Code", "Class", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.code}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.className ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModalState({ mode: "edit", item })} className="rounded p-1.5 text-slate-500 hover:bg-slate-100">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modalState?.mode === "create" && (
        <CreateSubjectModal classes={classes} onClose={() => setModalState(null)} onSaved={load} />
      )}
      {modalState?.mode === "edit" && (
        <EditSubjectModal item={modalState.item} onClose={() => setModalState(null)} onSaved={load} />
      )}
    </div>
  );
}

function CreateSubjectModal({ classes, onClose, onSaved }: { classes: ClassDto[]; onClose: () => void; onSaved: () => void }) {
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
