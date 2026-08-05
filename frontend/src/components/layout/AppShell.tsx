"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Avatar } from "@/components/ui/Avatar";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-indigo-700 dark:text-indigo-400" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      )}
    >
      {active && (
        <motion.span
          layoutId="active-nav-pill"
          className="absolute inset-0 rounded-lg bg-indigo-50 dark:bg-indigo-500/10"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className="relative z-10 h-4.5 w-4.5" />
      <span className="relative z-10">{item.label}</span>
    </Link>
  );
}

export function AppShell({ navItems, children }: { navItems: NavItem[]; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Longest-prefix match: a root item like "/admin" would otherwise also match "/admin/users"
  // (since it's a prefix), highlighting two nav items at once. Only the most specific match wins.
  const activeHref = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const isActive = (href: string) => href === activeHref;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 px-5 py-5">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">CampusFlow</span>
            </div>
            <ThemeToggle />
          </div>
          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </nav>
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <Avatar name={user?.fullName ?? "?"} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">{user?.fullName}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex-1 lg:pl-64">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">CampusFlow</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button onClick={logout} className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Sign out
              </button>
            </div>
          </header>

          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden dark:border-slate-800 dark:bg-slate-900">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-400"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
