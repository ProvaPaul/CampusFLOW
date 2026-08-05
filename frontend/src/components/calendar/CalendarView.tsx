"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { assignmentsApi, classesApi, eventsApi } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { buildCalendarItems, buildMonthGrid, groupItemsByDay, isSameDay, type CalendarItem, type CalendarItemType } from "@/lib/calendar";
import type { AssignmentDto, ClassDto, EventDto } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const ITEM_STYLES: Record<CalendarItemType, string> = {
  deadline: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  exam: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  holiday: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  meeting: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const eventSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  type: z.enum(["Exam", "Holiday", "Meeting", "Other"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  classId: z.string().optional(),
});
type EventValues = z.infer<typeof eventSchema>;

type ModalState = { mode: "create"; date?: Date } | { mode: "edit"; item: EventDto } | null;

export function CalendarView({ assignmentBasePath }: { assignmentBasePath: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentDto[] | null>(null);
  const [events, setEvents] = useState<EventDto[] | null>(null);
  const [classes, setClasses] = useState<ClassDto[]>([]);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [modalState, setModalState] = useState<ModalState>(null);

  const load = useCallback(async () => {
    const [a, e] = await Promise.all([assignmentsApi.getAll(), eventsApi.getAll()]);
    setAssignments(a);
    setEvents(e);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (user?.role === "Admin") classesApi.getAll().then(setClasses);
  }, [user]);

  const itemsByDay = useMemo(() => {
    if (!assignments || !events) return new Map<string, CalendarItem[]>();
    return groupItemsByDay(buildCalendarItems(assignments, events));
  }, [assignments, events]);

  const grid = useMemo(() => buildMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  const goToMonth = (delta: number) => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  const goToToday = () => {
    const d = new Date();
    d.setDate(1);
    setCursor(d);
  };

  const handleItemClick = (item: CalendarItem) => {
    if (item.type === "deadline" && item.assignmentId) {
      router.push(`${assignmentBasePath}/${item.assignmentId}`);
      return;
    }
    if (item.event && user?.role === "Admin") {
      setModalState({ mode: "edit", item: item.event });
    }
  };

  if (!assignments || !events) {
    return <SkeletonCard />;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => goToMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="w-40 text-center text-sm font-semibold text-slate-900 dark:text-slate-100">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <Button variant="secondary" size="sm" onClick={() => goToMonth(1)} aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          {user?.role === "Admin" && (
            <Button size="sm" onClick={() => setModalState({ mode: "create" })}>
              <Plus className="h-4 w-4" /> Add event
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
        <div className="min-w-160">
        <div className="grid grid-cols-7 border-b border-slate-100 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:text-slate-500">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const items = itemsByDay.get(day.toDateString()) ?? [];
            const inCurrentMonth = day.getMonth() === cursor.getMonth();
            const today = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 border-b border-r border-slate-100 p-1.5 dark:border-slate-800",
                  !inCurrentMonth && "bg-slate-50/60 dark:bg-slate-900/40"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                    today
                      ? "bg-indigo-600 font-semibold text-white"
                      : inCurrentMonth
                        ? "text-slate-600 dark:text-slate-300"
                        : "text-slate-300 dark:text-slate-600"
                  )}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {items.slice(0, 3).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={cn("block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium", ITEM_STYLES[item.type])}
                      title={item.title}
                    >
                      {item.title}
                    </button>
                  ))}
                  {items.length > 3 && <p className="px-1 text-[10px] text-slate-400 dark:text-slate-500">+{items.length - 3} more</p>}
                </div>
              </div>
            );
          })}
        </div>
        </div>
        </div>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          {(["deadline", "exam", "holiday", "meeting", "other"] as CalendarItemType[]).map((type) => (
            <span key={type} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", ITEM_STYLES[type].split(" ")[0])} />
              {type === "deadline" ? "Assignment deadline" : type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </CardBody>
      </Card>

      {modalState && (
        <EventModal
          state={modalState}
          classes={classes}
          onClose={() => setModalState(null)}
          onSaved={() => {
            setModalState(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EventModal({
  state,
  classes,
  onClose,
  onSaved,
}: {
  state: NonNullable<ModalState>;
  classes: ClassDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state.mode === "edit";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: isEdit
      ? {
          title: state.item.title,
          description: state.item.description,
          type: state.item.type,
          startDate: state.item.startDate.slice(0, 10),
          endDate: state.item.endDate?.slice(0, 10) ?? "",
          classId: state.item.classId ?? "",
        }
      : {
          title: "",
          description: "",
          type: "Other",
          startDate: state.date ? state.date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          endDate: "",
          classId: "",
        },
  });

  const onSubmit = async (values: EventValues) => {
    try {
      const payload = {
        title: values.title,
        description: values.description ?? "",
        type: values.type,
        startDate: new Date(values.startDate).toISOString(),
        endDate: values.endDate ? new Date(values.endDate).toISOString() : null,
        classId: values.classId || null,
      };
      if (isEdit) {
        await eventsApi.update(state.item.id, payload);
        toast.success("Event updated");
      } else {
        await eventsApi.create(payload);
        toast.success("Event created");
      }
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !confirm(`Delete "${state.item.title}"?`)) return;
    try {
      await eventsApi.remove(state.item.id);
      toast.success("Event deleted");
      onSaved();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit event" : "Add event"} description="Visible on the academic calendar for the relevant audience.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Title" required error={errors.title?.message} {...register("title")} />
        <Textarea label="Description" {...register("description")} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Type" required error={errors.type?.message} {...register("type")}>
            <option value="Exam">Exam</option>
            <option value="Holiday">Holiday</option>
            <option value="Meeting">Meeting</option>
            <option value="Other">Other</option>
          </Select>
          <Select label="Scope" {...register("classId")}>
            <option value="">School-wide</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start date" type="date" required error={errors.startDate?.message} {...register("startDate")} />
          <Input label="End date (optional)" type="date" {...register("endDate")} />
        </div>
        <div className="flex items-center justify-between pt-2">
          {isEdit ? (
            <Button type="button" variant="ghost" onClick={handleDelete} className="text-red-600 dark:text-red-400">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              <Pencil className="h-4 w-4" /> {isEdit ? "Save changes" : "Create event"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
