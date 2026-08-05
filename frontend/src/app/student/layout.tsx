"use client";

import { LayoutDashboard, CalendarDays, BarChart3 } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell, NavItem } from "@/components/layout/AppShell";

const navItems: NavItem[] = [
  { href: "/student", label: "My Assignments", icon: LayoutDashboard },
  { href: "/student/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/student/analytics", label: "Analytics", icon: BarChart3 },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="Student">
      <AppShell navItems={navItems}>{children}</AppShell>
    </RoleGuard>
  );
}
