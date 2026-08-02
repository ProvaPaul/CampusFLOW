"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { classesApi, usersApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ClassDto, UserDto, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { EmptyState, Spinner } from "@/components/ui/Spinner";

const createUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["Admin", "Teacher", "Student"]),
  classId: z.string().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  classId: z.string().optional(),
  isActive: z.boolean(),
});

type CreateUserValues = z.infer<typeof createUserSchema>;
type UpdateUserValues = z.infer<typeof updateUserSchema>;

const roleStyles: Record<UserRole, string> = {
  Admin: "bg-purple-50 text-purple-700 ring-purple-300",
  Teacher: "bg-blue-50 text-blue-700 ring-blue-300",
  Student: "bg-emerald-50 text-emerald-700 ring-emerald-300",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);

  const load = async () => {
    const [userList, classList] = await Promise.all([usersApi.getAll(), classesApi.getAll()]);
    setUsers(userList);
    setClasses(classList);
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (user: UserDto) => {
    if (!confirm(`Delete ${user.fullName}? This cannot be undone.`)) return;
    try {
      await usersApi.remove(user.id);
      toast.success("User deleted");
      load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (!users) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">Manage Admin, Teacher and Student accounts.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </div>

      <Card className="mt-6 overflow-hidden">
        {users.length === 0 ? (
          <EmptyState title="No users yet" description="Create your first user to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Name", "Email", "Role", "Class", "Status", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.fullName}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge className={roleStyles[user.role]}>{user.role}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.className ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge className={user.isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-slate-100 text-slate-600 ring-slate-300"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setEditingUser(user)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(user)} className="rounded p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete">
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

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} classes={classes} onCreated={load} />
      {editingUser && (
        <EditUserModal user={editingUser} classes={classes} onClose={() => setEditingUser(null)} onUpdated={load} />
      )}
    </div>
  );
}

function CreateUserModal({
  open,
  onClose,
  classes,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  classes: ClassDto[];
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({ resolver: zodResolver(createUserSchema), defaultValues: { role: "Student" } });
  const role = watch("role");

  const onSubmit = async (values: CreateUserValues) => {
    try {
      await usersApi.create({ ...values, classId: role === "Student" ? values.classId || null : null });
      toast.success("User created");
      reset();
      onClose();
      onCreated();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create user">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input label="Password" type="password" error={errors.password?.message} {...register("password")} />
        <Select label="Role" error={errors.role?.message} {...register("role")}>
          <option value="Admin">Admin</option>
          <option value="Teacher">Teacher</option>
          <option value="Student">Student</option>
        </Select>
        {role === "Student" && (
          <Select label="Class" error={errors.classId?.message} {...register("classId")}>
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Create user
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({
  user,
  classes,
  onClose,
  onUpdated,
}: {
  user: UserDto;
  classes: ClassDto[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { fullName: user.fullName, classId: user.classId ?? "", isActive: user.isActive },
  });

  const onSubmit = async (values: UpdateUserValues) => {
    try {
      await usersApi.update(user.id, { ...values, classId: values.classId || null });
      toast.success("User updated");
      onClose();
      onUpdated();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${user.fullName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" error={errors.fullName?.message} {...register("fullName")} />
        {user.role === "Student" && (
          <Select label="Class" error={errors.classId?.message} {...register("classId")}>
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600" {...register("isActive")} />
          Account is active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
