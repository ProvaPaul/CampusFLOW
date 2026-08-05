"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, Search, Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const FEATURES = [
  { icon: Search, text: "Press Ctrl+K anywhere to search and jump to what you need." },
  { icon: Bell, text: "The bell icon now shows deadlines, grades, and announcements." },
  { icon: CalendarDays, text: "A new Calendar brings deadlines and school events into one view." },
];

function storageKey(userId: string) {
  return `campusflow_whatsnew_seen_${userId}`;
}

export function WhatsNewBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const seen = window.localStorage.getItem(storageKey(user.id));
    if (!seen) setVisible(true);
  }, [user]);

  const dismiss = () => {
    if (user) window.localStorage.setItem(storageKey(user.id), "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-6 z-40 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4 text-indigo-500" /> What&apos;s new
            </p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss"
              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="mt-3 space-y-2.5">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                {text}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Got it, thanks
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
