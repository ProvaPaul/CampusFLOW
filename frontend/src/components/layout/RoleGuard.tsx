"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homePathForRole, useAuth } from "@/lib/auth-context";
import type { UserRole } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";

export function RoleGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(homePathForRole(user.role));
    }
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) {
    return <Spinner label="Loading your workspace..." />;
  }

  return <>{children}</>;
}
