"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

/**
 * Built on Radix Dialog for real accessibility (focus trap, ESC to close, ARIA wiring)
 * with a Framer Motion fade/scale transition. External API is unchanged from the plain
 * div-based version, so every existing call site upgrades automatically.
 */
export function Modal({ open, onClose, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
                <motion.div
                  className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-slate-800"
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                    <div>
                      <Dialog.Title className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</Dialog.Title>
                      {description && (
                        <Dialog.Description className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <button
                        type="button"
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="max-h-[75vh] overflow-y-auto px-5 py-4">{children}</div>
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
