"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./Spinner";
import { SkeletonTable } from "./Skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  /** Extracts a comparable value for this column — presence of this makes the column sortable. */
  sortAccessor?: (item: T) => string | number;
  className?: string;
  headerClassName?: string;
  align?: "left" | "right";
  /** Omit this column from the auto-generated mobile card (e.g. redundant with the card title). */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Renders the mobile card title — defaults to the first column's content. */
  mobileTitle?: (item: T) => React.ReactNode;
  /** Renders a trailing badge/status on the mobile card header row. */
  mobileBadge?: (item: T) => React.ReactNode;
}

type SortDirection = "asc" | "desc" | null;

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  loading,
  emptyTitle = "No results",
  emptyDescription,
  mobileTitle,
  mobileBadge,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  if (loading) return <SkeletonTable columns={columns.length} />;
  if (data.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  const sortColumn = columns.find((c) => c.key === sortKey);
  const sorted =
    sortColumn?.sortAccessor && sortDirection
      ? [...data].sort((a, b) => {
          const av = sortColumn.sortAccessor!(a);
          const bv = sortColumn.sortAccessor!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDirection === "asc" ? cmp : -cmp;
        })
      : data;

  const toggleSort = (col: DataTableColumn<T>) => {
    if (!col.sortAccessor) return;
    if (sortKey !== col.key) {
      setSortKey(col.key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  return (
    <>
      {/* Desktop / tablet: table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800/60">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400",
                    col.align === "right" && "text-right",
                    col.headerClassName
                  )}
                >
                  {col.sortAccessor ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200",
                        col.align === "right" && "flex-row-reverse"
                      )}
                    >
                      {col.header}
                      {sortKey === col.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3 text-sm", col.align === "right" && "text-right", col.className)}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list */}
      <ul className="space-y-3 md:hidden">
        {sorted.map((item) => {
          const visibleColumns = columns.filter((c) => !c.hideOnMobile);
          return (
            <li
              key={keyExtractor(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={cn(
                "rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
                onRowClick && "cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60"
              )}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {mobileTitle ? mobileTitle(item) : visibleColumns[0]?.render(item)}
                </span>
                {mobileBadge?.(item)}
              </div>
              <dl className="space-y-1">
                {/* Column 0 is always represented in the title above — either by default or via a
                    custom mobileTitle that restyles it (e.g. name + avatar) — so skip it here too. */}
                {visibleColumns.slice(1).map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-2 text-xs">
                    <dt className="text-slate-500 dark:text-slate-400">{col.header}</dt>
                    <dd className="text-slate-700 dark:text-slate-300">{col.render(item)}</dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
    </>
  );
}
