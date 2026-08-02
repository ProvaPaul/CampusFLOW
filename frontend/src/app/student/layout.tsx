"use client";

import { LayoutDashboard } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell, NavItem } from "@/components/layout/AppShell";

const navItems: NavItem[] = [{ href: "/student", label: "My Assignments", icon: LayoutDashboard }];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="Student">
      <AppShell navItems={navItems}>{children}</AppShell>
    </RoleGuard>
  );
}
