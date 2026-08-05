"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Clock, GraduationCap, Inbox, Megaphone, UserCheck, type LucideIcon } from "lucide-react";
import type { NotificationItem, NotificationType } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, LucideIcon> = {
  deadline_approaching: Clock,
  assignment_published: Megaphone,
  teacher_assigned: UserCheck,
  assignment_graded: GraduationCap,
  submission_received: Inbox,
  announcement: Megaphone,
};

/**
 * Presentational only — data comes from a single `useNotifications()` call made once by
 * `AppShell` and passed down, since this component is mounted in both the desktop sidebar
 * and the mobile header (both stay in the DOM at once; only CSS decides which is visible).
 */
export interface NotificationBellProps {
  items: NotificationItem[];
  readIds: Set<string>;
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export function NotificationBell({ items, readIds, unreadCount, loading, markRead, markAllRead }: NotificationBellProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
            ) : (
              items.map((item) => {
                const Icon = ICONS[item.type];
                const isRead = readIds.has(item.id);
                const body = (
                  <div
                    className={cn(
                      "flex gap-2.5 border-b border-slate-50 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/60",
                      !isRead && "bg-indigo-50/50 dark:bg-indigo-500/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        isRead
                          ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                          : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</span>
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{item.message}</span>
                      <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                        {formatDistanceToNow(item.date, { addSuffix: true })}
                      </span>
                    </span>
                    {!isRead && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />}
                  </div>
                );

                return item.link ? (
                  <Link key={item.id} href={item.link} onClick={() => markRead(item.id)} className="block">
                    {body}
                  </Link>
                ) : (
                  <button key={item.id} type="button" onClick={() => markRead(item.id)} className="block w-full">
                    {body}
                  </button>
                );
              })
            )}
          </div>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
