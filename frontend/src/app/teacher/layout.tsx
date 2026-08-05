"use client";

import { LayoutDashboard, PlusCircle, CalendarDays, BarChart3 } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell, NavItem } from "@/components/layout/AppShell";

const navItems: NavItem[] = [
  { href: "/teacher", label: "My Assignments", icon: LayoutDashboard },
  { href: "/teacher/assignments/new", label: "New Assignment", icon: PlusCircle },
  { href: "/teacher/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="Teacher">
      <AppShell navItems={navItems}>{children}</AppShell>
    </RoleGuard>
  );
}
