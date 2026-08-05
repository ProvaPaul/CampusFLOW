"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Clock,
  Layers,
  Search,
  Star,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { assignmentsApi, classesApi, subjectsApi, teacherAssignmentsApi, usersApi } from "@/lib/api";
import { getFavoritePages, getRecentPages, getRecentSearches, recordRecentPage, recordRecentSearch } from "@/lib/productivity";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: LucideIcon;
  keywords?: string;
  path: string;
}

function quickActionsFor(role: string): PaletteItem[] {
  if (role === "Admin") {
    return [
      { id: "qa-user", label: "Invite user", sublabel: "Quick action", icon: UserPlus, path: "/admin/users?new=1" },
      { id: "qa-class", label: "Create class", sublabel: "Quick action", icon: Layers, path: "/admin/classes?new=1" },
      { id: "qa-subject", label: "Create subject", sublabel: "Quick action", icon: BookOpen, path: "/admin/subjects?new=1" },
      { id: "qa-teacher", label: "Assign teacher", sublabel: "Quick action", icon: UserCheck, path: "/admin/teacher-assignments?new=1" },
    ];
  }
  if (role === "Teacher") {
    return [{ id: "qa-assignment", label: "New assignment", sublabel: "Quick action", icon: ClipboardList, path: "/teacher/assignments/new" }];
  }
  return [];
}

/**
 * Splitting the dialog engine (mounted once) from its trigger buttons (rendered wherever a
 * visible "Search…" affordance is needed — the desktop sidebar and mobile header both stay
 * in the DOM at once, so a naive single component would double-mount the dialog).
 */
const CommandPaletteContext = createContext<(() => void) | null>(null);

export function useCommandPalette(): () => void {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within a CommandPaletteProvider");
  return ctx;
}

export function CommandPaletteButton() {
  const open = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:text-slate-400"
    >
      <Search className="h-4 w-4" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium sm:inline dark:border-slate-700 dark:bg-slate-800">
        Ctrl K
      </kbd>
    </button>
  );
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [indexItems, setIndexItems] = useState<PaletteItem[]>([]);
  const [indexLoading, setIndexLoading] = useState(false);
  const [indexLoadedForRole, setIndexLoadedForRole] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const loadIndex = useCallback(async () => {
    if (!user || indexLoadedForRole === user.role) return;
    setIndexLoading(true);
    try {
      const items: PaletteItem[] = [];

      if (user.role === "Admin") {
        const [users, classes, subjects, assignments] = await Promise.all([
          usersApi.getAll(),
          classesApi.getAll(),
          subjectsApi.getAll(),
          assignmentsApi.getAll(),
        ]);
        users.forEach((u) => items.push({ id: `u-${u.id}`, label: u.fullName, sublabel: `${u.role} · ${u.email}`, icon: Users, path: "/admin/users" }));
        classes.forEach((c) => items.push({ id: `c-${c.id}`, label: c.name, sublabel: "Class", icon: Layers, path: "/admin/classes" }));
        subjects.forEach((s) => items.push({ id: `s-${s.id}`, label: s.name, sublabel: `Subject · ${s.className ?? ""}`, icon: BookOpen, path: "/admin/subjects" }));
        assignments.forEach((a) =>
          items.push({ id: `a-${a.id}`, label: a.title, sublabel: `Assignment · ${a.className}`, icon: ClipboardList, path: `/admin/assignments/${a.id}` })
        );
      } else if (user.role === "Teacher") {
        const [assignments, teacherAssignments] = await Promise.all([assignmentsApi.getAll(), teacherAssignmentsApi.getAll(user.id)]);
        assignments.forEach((a) =>
          items.push({ id: `a-${a.id}`, label: a.title, sublabel: `Assignment · ${a.className}`, icon: ClipboardList, path: `/teacher/assignments/${a.id}` })
        );
        teacherAssignments.forEach((ta) =>
          items.push({ id: `ta-${ta.id}`, label: `${ta.subjectName} — ${ta.className}`, sublabel: "Your teaching assignment", icon: UserCheck, path: "/teacher" })
        );
      } else {
        const assignments = await assignmentsApi.getAll();
        assignments.forEach((a) =>
          items.push({ id: `a-${a.id}`, label: a.title, sublabel: `${a.subjectName} · ${a.className}`, icon: ClipboardList, path: `/student/assignments/${a.id}` })
        );
      }

      setIndexItems(items);
      setIndexLoadedForRole(user.role);
    } finally {
      setIndexLoading(false);
    }
  }, [user, indexLoadedForRole]);

  useEffect(() => {
    if (isOpen) loadIndex();
  }, [isOpen, loadIndex]);

  const quickActions = useMemo(() => (user ? quickActionsFor(user.role) : []), [user]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [...quickActions, ...indexItems]
      .filter((item) => `${item.label} ${item.sublabel ?? ""} ${item.keywords ?? ""}`.toLowerCase().includes(q))
      .slice(0, 20);
  }, [query, quickActions, indexItems]);

  const recentPages = user ? getRecentPages(user.id) : [];
  const favoritePages = user ? getFavoritePages(user.id) : [];
  const recentSearches = user ? getRecentSearches(user.id) : [];

  const goTo = (item: { path: string; label: string }) => {
    if (user) {
      recordRecentPage(user.id, item.path, item.label);
      if (query.trim()) recordRecentSearch(user.id, query.trim());
    }
    setIsOpen(false);
    setQuery("");
    router.push(item.path);
  };

  const open = useCallback(() => setIsOpen(true), []);

  return (
    <CommandPaletteContext.Provider value={open}>
      {children}
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <AnimatePresence>
          {isOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  className="fixed left-1/2 top-24 z-50 w-[92vw] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                >
                  <Dialog.Title className="sr-only">Search CampusFlow</Dialog.Title>
                  <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={user?.role === "Admin" ? "Search users, classes, subjects, assignments…" : "Search assignments…"}
                      className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                    />
                    <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                      Esc
                    </kbd>
                  </div>

                  <div className="max-h-96 overflow-y-auto p-2">
                    {query.trim() ? (
                      indexLoading ? (
                        <p className="px-2 py-6 text-center text-sm text-slate-400">Searching…</p>
                      ) : results.length === 0 ? (
                        <p className="px-2 py-6 text-center text-sm text-slate-400">No matches for &quot;{query}&quot;.</p>
                      ) : (
                        results.map((item) => <PaletteRow key={item.id} item={item} onSelect={() => goTo(item)} />)
                      )
                    ) : (
                      <>
                        {quickActions.length > 0 && (
                          <Section title="Quick actions">
                            {quickActions.map((item) => (
                              <PaletteRow key={item.id} item={item} onSelect={() => goTo(item)} />
                            ))}
                          </Section>
                        )}
                        {favoritePages.length > 0 && (
                          <Section title="Favorites">
                            {favoritePages.map((p) => (
                              <PaletteRow key={p.path} item={{ id: p.path, label: p.label, icon: Star, path: p.path }} onSelect={() => goTo(p)} />
                            ))}
                          </Section>
                        )}
                        {recentPages.length > 0 && (
                          <Section title="Recently viewed">
                            {recentPages.map((p) => (
                              <PaletteRow key={p.path} item={{ id: p.path, label: p.label, icon: Clock, path: p.path }} onSelect={() => goTo(p)} />
                            ))}
                          </Section>
                        )}
                        {recentSearches.length > 0 && (
                          <Section title="Recent searches">
                            {recentSearches.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setQuery(s)}
                                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/60"
                              >
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {s}
                              </button>
                            ))}
                          </Section>
                        )}
                        {quickActions.length === 0 && recentPages.length === 0 && favoritePages.length === 0 && recentSearches.length === 0 && (
                          <p className="px-2 py-6 text-center text-sm text-slate-400">Start typing to search.</p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </CommandPaletteContext.Provider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1 last:mb-0">
      <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function PaletteRow({ item, onSelect }: { item: PaletteItem; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        "hover:bg-slate-50 dark:hover:bg-slate-800/60"
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-slate-800 dark:text-slate-100">{item.label}</span>
        {item.sublabel && <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.sublabel}</span>}
      </span>
    </button>
  );
}
