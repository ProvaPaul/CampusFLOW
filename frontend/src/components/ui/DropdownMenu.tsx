"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" | "center" }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={4}
        className="z-50 min-w-40 overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  destructive,
  disabled,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-none transition-colors",
        "data-[highlighted]:bg-slate-100 dark:data-[highlighted]:bg-slate-800",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        destructive ? "text-red-600 dark:text-red-400" : "text-slate-700 dark:text-slate-300"
      )}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

/** Convenience trigger button — a plain "⋯" icon button, ready to drop into a table row. */
export function DropdownMenuIconTrigger({ label = "Open menu" }: { label?: string }) {
  return (
    <DropdownMenuPrimitive.Trigger asChild>
      <button
        type="button"
        aria-label={label}
        className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </DropdownMenuPrimitive.Trigger>
  );
}
