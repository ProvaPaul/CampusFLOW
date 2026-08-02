"use client";

import { LayoutDashboard, PlusCircle } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell, NavItem } from "@/components/layout/AppShell";

const navItems: NavItem[] = [
  { href: "/teacher", label: "My Assignments", icon: LayoutDashboard },
  { href: "/teacher/assignments/new", label: "New Assignment", icon: PlusCircle },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="Teacher">
      <AppShell navItems={navItems}>{children}</AppShell>
    </RoleGuard>
  );
}
