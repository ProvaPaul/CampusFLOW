"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Trash2 } from "lucide-react";
import { classesApi, subjectsApi, teacherAssignmentsApi, usersApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ClassDto, SubjectDto, TeacherAssignmentDto, UserDto } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Input";
import { EmptyState, Spinner } from "@/components/ui/Spinner";

const schema = z.object({
  teacherId: z.string().min(1, "Select a teacher"),
  classId: z.string().min(1, "Select a class"),
  subjectId: z.string().min(1, "Select a subject"),
});
type FormValues = z.infer<typeof schema>;

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<TeacherAssignmentDto[] | null>(null);
  const [teachers, setTeachers] = useState<UserDto[]>([]);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    const [assignmentList, users, classList, subjectList] = await Promise.all([
      teacherAssignmentsApi.getAll(),
      usersApi.getAll(),
      classesApi.getAll(),
      subjectsApi.getAll(),
    ]);
    setAssignments(assignmentList);
    setTeachers(users.filter((u) => u.role === "Teacher"));
    setClasses(classList);
    setSubjects(subjectList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (item: TeacherAssignmentDto) => {
    if (!confirm(`Remove ${item.teacherName} from ${item.subjectName} (${item.className})?`)) return;
    try {
      await teacherAssignmentsApi.remove(item.id);
      toast.success("Assignment removed");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!assignments) return <Spinner />;

  const canCreate = teachers.length > 0 && classes.length > 0 && subjects.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Teacher Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">Assign teachers to a subject within a class/course.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!canCreate}>
          <Plus className="h-4 w-4" /> New assignment
        </Button>
      </div>

      {!canCreate && (
        <p className="mt-3 text-sm text-amber-600">You need at least one teacher, class, and subject before assigning.</p>
      )}

      <Card className="mt-6 overflow-hidden">
        {assignments.length === 0 ? (
          <EmptyState title="No teacher assignments yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.teacherName}</p>
                  <p className="text-sm text-slate-500">
                    {item.subjectName} · {item.className}
                  </p>
                </div>
                <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-500 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {modalOpen && (
        <AssignmentModal
          teachers={teachers}
          classes={classes}
          subjects={subjects}
          onClose={() => setModalOpen(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function AssignmentModal({
  teachers,
  classes,
  subjects,
  onClose,
  onSaved,
}: {
  teachers: UserDto[];
  classes: ClassDto[];
  subjects: SubjectDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedClassId = watch("classId");
  const filteredSubjects = useMemo(
    () => subjects.filter((s) => s.classId === selectedClassId),
    [subjects, selectedClassId]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      await teacherAssignmentsApi.create(values);
      toast.success("Teacher assigned");
      onClose();
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title="Assign teacher to subject">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Teacher" error={errors.teacherId?.message} {...register("teacherId")}>
          <option value="">Select a teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </Select>
        <Select label="Class" error={errors.classId?.message} {...register("classId")}>
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Subject" hint={!selectedClassId ? "Select a class first" : undefined} error={errors.subjectId?.message} {...register("subjectId")} disabled={!selectedClassId}>
          <option value="">Select a subject</option>
          {filteredSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Assign
          </Button>
        </div>
      </form>
    </Modal>
  );
}
