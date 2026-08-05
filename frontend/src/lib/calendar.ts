import type { AssignmentDto, EventDto } from "./types";

export type CalendarItemType = "deadline" | "exam" | "holiday" | "meeting" | "other";

export interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  date: Date;
  assignmentId?: string;
  event?: EventDto;
}

const EVENT_TYPE_TO_ITEM_TYPE: Record<EventDto["type"], CalendarItemType> = {
  Exam: "exam",
  Holiday: "holiday",
  Meeting: "meeting",
  Other: "other",
};

export function buildCalendarItems(assignments: AssignmentDto[], events: EventDto[]): CalendarItem[] {
  const deadlineItems: CalendarItem[] = assignments
    .filter((a) => a.status === "Published")
    .map((a) => ({
      id: `deadline-${a.id}`,
      type: "deadline",
      title: `${a.title} due`,
      date: new Date(a.deadline),
      assignmentId: a.id,
    }));

  const eventItems: CalendarItem[] = events.map((e) => ({
    id: `event-${e.id}`,
    type: EVENT_TYPE_TO_ITEM_TYPE[e.type],
    title: e.title,
    date: new Date(e.startDate),
    event: e,
  }));

  return [...deadlineItems, ...eventItems];
}

/** Returns a 6x7 grid of dates covering the full weeks needed to display the given month. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function groupItemsByDay(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  items.forEach((item) => {
    const key = item.date.toDateString();
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  });
  return map;
}
