"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, KeyRound } from "lucide-react";
import { classesApi, usersApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import type { ClassDto, UserDto, UserRole } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Avatar } from "@/components/ui/Avatar";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable, type DataTableColumn } from "@/components/ui/DataTable";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuIconTrigger } from "@/components/ui/DropdownMenu";

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

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type CreateUserValues = z.infer<typeof createUserSchema>;
type UpdateUserValues = z.infer<typeof updateUserSchema>;
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const roleStyles: Record<UserRole, string> = {
  Admin: "bg-purple-50 text-purple-700 ring-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-800",
  Teacher: "bg-blue-50 text-blue-700 ring-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-800",
  Student: "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-800",
};

const PAGE_SIZE = 10;
const roleFilterOptions: Array<UserRole | "All"> = ["All", "Admin", "Teacher", "Student"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserDto[] | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [resettingUser, setResettingUser] = useState<UserDto | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [page, setPage] = useState(1);

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

  const filtered = useMemo(() => {
    if (!users) return [];
    const query = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch = !query || u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataTableColumn<UserDto>[] = [
    {
      key: "name",
      header: "Name",
      sortAccessor: (u) => u.fullName,
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.fullName} size="sm" />
          <span className="font-medium text-slate-900 dark:text-slate-100">{u.fullName}</span>
        </div>
      ),
    },
    { key: "email", header: "Email", sortAccessor: (u) => u.email, render: (u) => <span className="text-slate-600 dark:text-slate-400">{u.email}</span> },
    { key: "role", header: "Role", sortAccessor: (u) => u.role, render: (u) => <Badge className={roleStyles[u.role]}>{u.role}</Badge> },
    { key: "class", header: "Class", render: (u) => <span className="text-slate-600 dark:text-slate-400">{u.className ?? "—"}</span> },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <Badge
          className={
            u.isActive
              ? "bg-emerald-50 text-emerald-700 ring-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-800"
              : "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700"
          }
        >
          {u.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      hideOnMobile: true,
      render: (u) => (
        <DropdownMenu>
          <DropdownMenuIconTrigger label={`Actions for ${u.fullName}`} />
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setEditingUser(u)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setResettingUser(u)}>
              <KeyRound className="h-3.5 w-3.5" /> Reset password
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDelete(u)} destructive>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Users</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage Admin, Teacher and Student accounts.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New user
        </Button>
      </div>

      {!users ? (
        <div className="mt-6">
          <SkeletonTable columns={5} />
        </div>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center dark:border-slate-800">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              placeholder="Search by name or email..."
              className="flex-1"
            />
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as UserRole | "All");
                setPage(1);
              }}
              className="sm:w-40"
            >
              {roleFilterOptions.map((r) => (
                <option key={r} value={r}>
                  {r === "All" ? "All roles" : r}
                </option>
              ))}
            </Select>
          </div>

          <div className="p-4">
            <DataTable
              data={pageItems}
              columns={columns}
              keyExtractor={(u) => u.id}
              mobileTitle={(u) => (
                <div className="flex items-center gap-2.5">
                  <Avatar name={u.fullName} size="sm" />
                  {u.fullName}
                </div>
              )}
              mobileBadge={(u) => <Badge className={roleStyles[u.role]}>{u.role}</Badge>}
              emptyTitle={users.length === 0 ? "No users yet" : "No users match your search/filter"}
              emptyDescription={users.length === 0 ? "Create your first user to get started." : undefined}
            />
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} itemLabel="user" />
            </div>
          </div>
        </Card>
      )}

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} classes={classes} onCreated={load} />
      {editingUser && (
        <EditUserModal user={editingUser} classes={classes} onClose={() => setEditingUser(null)} onUpdated={load} />
      )}
      {resettingUser && <ResetPasswordModal user={resettingUser} onClose={() => setResettingUser(null)} />}
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
    <Modal open={open} onClose={onClose} title="Create user" description="Admins, teachers and students all sign in with these credentials.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" required error={errors.fullName?.message} {...register("fullName")} />
        <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
        <Input
          label="Password"
          type="password"
          required
          hint="At least 6 characters."
          error={errors.password?.message}
          {...register("password")}
        />
        <Select label="Role" required error={errors.role?.message} {...register("role")}>
          <option value="Admin">Admin</option>
          <option value="Teacher">Teacher</option>
          <option value="Student">Student</option>
        </Select>
        {role === "Student" && (
          <Select label="Class" required error={errors.classId?.message} {...register("classId")}>
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
    <Modal open onClose={onClose} title={`Edit ${user.fullName}`} description={`${user.email} · ${user.role}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" required error={errors.fullName?.message} {...register("fullName")} />
        {user.role === "Student" && (
          <Select label="Class" required error={errors.classId?.message} {...register("classId")}>
            <option value="">Select a class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 dark:border-slate-600 dark:bg-slate-800"
            {...register("isActive")}
          />
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

function ResetPasswordModal({ user, onClose }: { user: UserDto; onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      await usersApi.resetPassword(user.id, values.newPassword);
      toast.success(`Password reset for ${user.fullName}`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title={`Reset password — ${user.fullName}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Sets a new password for <span className="font-medium text-slate-700 dark:text-slate-300">{user.email}</span> immediately.
          No email is sent — share the new password with them directly.
        </p>
        <Input label="New password" type="password" required error={errors.newPassword?.message} {...register("newPassword")} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Reset password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
