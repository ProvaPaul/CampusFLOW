"use client";

import { useMemo, useState } from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Card, CardBody } from "@/components/ui/Card";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { useAdminAnalytics } from "@/lib/use-admin-analytics";
import type { ActivityType } from "@/lib/admin-analytics";

const PAGE_SIZE = 20;

const TYPE_LABELS: Record<ActivityType, string> = {
  class_created: "Class created",
  subject_created: "Subject created",
  teacher_assigned: "Teacher assigned",
  assignment_created: "Assignment created",
  assignment_published: "Assignment published",
  submission_received: "Submission received",
  submission_graded: "Submission graded",
};

export default function AdminTimelinePage() {
  const { data, loading } = useAdminAnalytics();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ActivityType | "All">("All");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data.activity.filter((event) => {
      const matchesQuery = !query || event.text.toLowerCase().includes(query);
      const matchesType = typeFilter === "All" || event.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [data, search, typeFilter]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Activity Timeline" }]} />
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Activity Timeline</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Every recorded event across the platform, newest first.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <SearchInput value={search} onChange={setSearch} placeholder="Search activity…" />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as ActivityType | "All");
            setPage(1);
          }}
          className="sm:w-56"
        >
          <option value="All">All activity types</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardBody>
          <ActivityFeed events={paged} />
        </CardBody>
      </Card>

      <Pagination
        page={page}
        totalPages={Math.ceil(filtered.length / PAGE_SIZE)}
        totalItems={filtered.length}
        onPageChange={setPage}
        itemLabel="event"
      />
    </div>
  );
}
