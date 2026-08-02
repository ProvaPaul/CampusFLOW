"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { homePathForRole, useAuth } from "@/lib/auth-context";
import { getApiErrorMessage } from "@/lib/api-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const demoAccounts = [
  { role: "Admin", email: "admin@campusflow.edu", password: "Admin@123" },
  { role: "Teacher", email: "teacher1@campusflow.edu", password: "Teacher@123" },
  { role: "Student", email: "student1@campusflow.edu", password: "Student@123" },
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
    <div className="flex min-h-screen flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <GraduationCap className="h-10 w-10 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">CampusFlow</h1>
          <p className="text-sm text-slate-500">Assignment &amp; Submission Management System</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Input label="Email" type="email" autoComplete="email" placeholder="you@campusflow.edu" error={errors.email?.message} {...register("email")} />
          <Input label="Password" type="password" autoComplete="current-password" placeholder="••••••••" error={errors.password?.message} {...register("password")} />
          <Button type="submit" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>

        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts</p>
          <ul className="mt-2 space-y-2">
            {demoAccounts.map((account) => (
              <li key={account.role} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{account.role}</span>
                <button
                  type="button"
                  className="text-indigo-600 hover:underline"
                  onClick={() => {
                    setValue("email", account.email);
                    setValue("password", account.password);
                  }}
                >
                  {account.email}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
