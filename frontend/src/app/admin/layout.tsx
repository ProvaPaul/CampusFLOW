"use client";

import { LayoutDashboard, Users, Layers, BookOpen, UserCheck, ClipboardList, CalendarDays, BarChart3, Trophy } from "lucide-react";
import { RoleGuard } from "@/components/layout/RoleGuard";
import { AppShell, NavItem } from "@/components/layout/AppShell";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/classes", label: "Classes", icon: Layers },
  { href: "/admin/subjects", label: "Subjects", icon: BookOpen },
  { href: "/admin/teacher-assignments", label: "Teacher Assignments", icon: UserCheck },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/leaderboards", label: "Leaderboards", icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="Admin">
      <AppShell navItems={navItems}>{children}</AppShell>
    </RoleGuard>
  );
}
