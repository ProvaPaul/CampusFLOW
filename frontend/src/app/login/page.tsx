"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, ShieldCheck, BookOpen, ClipboardCheck, Users2 } from "lucide-react";
import toast from "react-hot-toast";
import { homePathForRole, useAuth } from "@/lib/auth-context";
import { getApiErrorMessage } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Admin", email: "admin@campusflow.edu", password: "Admin@123", icon: ShieldCheck },
  { role: "Teacher", email: "teacher1@campusflow.edu", password: "Teacher@123", icon: BookOpen },
  { role: "Student", email: "student1@campusflow.edu", password: "Student@123", icon: GraduationCap },
];

const highlights = [
  { icon: ClipboardCheck, text: "Create, publish and track assignments by class and subject" },
  { icon: Users2, text: "Role-based access for Admins, Teachers and Students" },
  { icon: GraduationCap, text: "Submit, grade and give feedback — all in one place" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast.success(`Welcome back, ${user.fullName}!`);
      router.replace(homePathForRole(user.role));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* Branding panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">CampusFlow</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-bold leading-tight text-balance">
            Assignments and submissions, organized for everyone.
          </h1>
          <p className="mt-3 text-sm text-indigo-100">
            A single place for admins, teachers and students to manage the full assignment lifecycle.
          </p>
          <ul className="mt-8 space-y-4">
            {highlights.map((item) => (
              <li key={item.text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-indigo-50">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200/70">
          Built for the OnnoRokom Projukti recruitment assignment.
        </p>
      </div>

      {/* Form panel */}
      <div className="relative flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-16">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle className="ring-1 ring-slate-200 dark:ring-slate-800" />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 lg:hidden dark:bg-indigo-500/10">
              <GraduationCap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to your CampusFlow account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@campusflow.edu"
              error={errors.email?.message}
              {...register("email")}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <Button type="submit" className="w-full" loading={submitting}>
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Demo accounts
            </p>
            <ul className="mt-3 space-y-1">
              {demoAccounts.map((account) => (
                <li key={account.role}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue("email", account.email);
                      setValue("password", account.password);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white dark:hover:bg-slate-800"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-indigo-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-indigo-400 dark:ring-slate-700">
                      <account.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="flex-1 text-xs font-medium text-slate-700 dark:text-slate-300">{account.role}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{account.email}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">Click a role to autofill credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
