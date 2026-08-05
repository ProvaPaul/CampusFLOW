"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ClipboardList, Layers, Plus, UserCheck, UserPlus, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface FabAction {
  label: string;
  icon: LucideIcon;
  path: string;
}

function actionsFor(role: string): FabAction[] {
  if (role === "Admin") {
    return [
      { label: "Invite user", icon: UserPlus, path: "/admin/users?new=1" },
      { label: "Create class", icon: Layers, path: "/admin/classes?new=1" },
      { label: "Create subject", icon: BookOpen, path: "/admin/subjects?new=1" },
      { label: "Assign teacher", icon: UserCheck, path: "/admin/teacher-assignments?new=1" },
    ];
  }
  if (role === "Teacher") {
    return [{ label: "New assignment", icon: ClipboardList, path: "/teacher/assignments/new" }];
  }
  return [];
}

export function QuickActionsFab() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const actions = user ? actionsFor(user.role) : [];

  if (actions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open &&
          actions.map((action, i) => (
            <motion.button
              key={action.label}
              type="button"
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => {
                setOpen(false);
                router.push(action.path);
              }}
              className="flex items-center gap-2 rounded-full bg-white py-2 pl-3 pr-4 text-sm font-medium text-slate-700 shadow-lg ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
            >
              <action.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {action.label}
            </motion.button>
          ))}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.95 }}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-colors hover:bg-indigo-700"
      >
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.15 }}>
          <Plus className="h-6 w-6" />
        </motion.span>
      </motion.button>
    </div>
  );
}
