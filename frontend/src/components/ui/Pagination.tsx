import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function Pagination({ page, totalPages, totalItems, onPageChange, itemLabel = "result" }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row dark:border-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Page {page} of {totalPages} <span className="text-slate-400 dark:text-slate-500">&middot;</span> {totalItems} {itemLabel}
        {totalItems === 1 ? "" : "s"}
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
