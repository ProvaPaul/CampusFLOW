"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homePathForRole, useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homePathForRole(user.role) : "/login");
  }, [loading, user, router]);

  return <Spinner label="Loading CampusFlow..." />;
}
