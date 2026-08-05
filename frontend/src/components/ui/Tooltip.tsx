"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>
  );
}

export function Tooltip({ content, children, className }: { content: string; children: React.ReactNode; className?: string }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          sideOffset={6}
          className={cn(
            "z-50 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-md dark:bg-slate-100 dark:text-slate-900",
            className
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-slate-900 dark:fill-slate-100" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
