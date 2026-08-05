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
import { EmptyState } from "@/components/ui/Spinner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";

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
  const [search, setSearch] = useState("");

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

  const canCreate = teachers.length > 0 && classes.length > 0 && subjects.length > 0;

  const filtered = (assignments ?? []).filter((item) => {
    const query = search.trim().toLowerCase();
    return (
      !query ||
      item.teacherName.toLowerCase().includes(query) ||
      item.subjectName.toLowerCase().includes(query) ||
      item.className.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Teacher Assignments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Assign teachers to a subject within a class/course.</p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!canCreate}>
          <Plus className="h-4 w-4" /> New assignment
        </Button>
      </div>

      {!canCreate && assignments && (
        <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">You need at least one teacher, class, and subject before assigning.</p>
      )}

      {!assignments ? (
        <div className="mt-6 space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          {assignments.length > 0 && (
            <div className="border-b border-slate-100 p-4 dark:border-slate-800">
              <SearchInput value={search} onChange={setSearch} placeholder="Search by teacher, subject, or class..." />
            </div>
          )}
          {filtered.length === 0 ? (
            <EmptyState title={assignments.length === 0 ? "No teacher assignments yet" : "No matches"} />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar name={item.teacherName} />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.teacherName}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {item.subjectName} · {item.className}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item)}
                    aria-label={`Remove ${item.teacherName} from ${item.subjectName}`}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

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
    <Modal open onClose={onClose} title="Assign teacher to subject" description="Grants this teacher permission to create and grade assignments for the subject within the class.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Teacher" required error={errors.teacherId?.message} {...register("teacherId")}>
          <option value="">Select a teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.fullName}
            </option>
          ))}
        </Select>
        <Select label="Class" required error={errors.classId?.message} {...register("classId")}>
          <option value="">Select a class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select label="Subject" required hint={!selectedClassId ? "Select a class first" : undefined} error={errors.subjectId?.message} {...register("subjectId")} disabled={!selectedClassId}>
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
