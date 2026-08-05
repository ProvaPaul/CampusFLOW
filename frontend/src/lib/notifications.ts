"use client";

import { useCallback, useEffect, useState } from "react";
import { announcementsApi, assignmentsApi, submissionsApi, teacherAssignmentsApi } from "./api";
import { useAuth } from "./auth-context";
import { dateFromObjectId } from "./object-id";
import type { AnnouncementDto } from "./types";

export type NotificationType =
  | "deadline_approaching"
  | "assignment_published"
  | "teacher_assigned"
  | "assignment_graded"
  | "submission_received"
  | "announcement";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  link?: string;
}

const READ_IDS_MAX = 300;
const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DEADLINE_WINDOW_MS = 48 * 60 * 60 * 1000;

function readIdsKey(userId: string) {
  return `campusflow_notifications_read_${userId}`;
}

function loadReadIds(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(readIdsKey(userId));
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(userId: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  const trimmed = Array.from(ids).slice(-READ_IDS_MAX);
  window.localStorage.setItem(readIdsKey(userId), JSON.stringify(trimmed));
}

function announcementItems(announcements: AnnouncementDto[]): NotificationItem[] {
  return announcements.map((a) => ({
    id: `announcement-${a.id}`,
    type: "announcement",
    title: a.title,
    message: a.message,
    date: new Date(a.createdAt),
  }));
}

async function computeForStudent(): Promise<NotificationItem[]> {
  const [assignments, mySubmissions, announcements] = await Promise.all([
    assignmentsApi.getAll(),
    submissionsApi.getMy(),
    announcementsApi.getAll(),
  ]);

  const now = Date.now();
  const items: NotificationItem[] = [...announcementItems(announcements)];

  assignments.forEach((a) => {
    const publishedAt = a.updatedAt ?? a.createdAt;
    if (now - new Date(publishedAt).getTime() < RECENT_WINDOW_MS) {
      items.push({
        id: `published-${a.id}`,
        type: "assignment_published",
        title: "New assignment published",
        message: `"${a.title}" (${a.subjectName}) is now available.`,
        date: new Date(publishedAt),
        link: `/student/assignments/${a.id}`,
      });
    }

    if (!a.mySubmission) {
      const msUntilDeadline = new Date(a.deadline).getTime() - now;
      if (msUntilDeadline > 0 && msUntilDeadline < DEADLINE_WINDOW_MS) {
        items.push({
          id: `deadline-${a.id}`,
          type: "deadline_approaching",
          title: "Deadline approaching",
          message: `"${a.title}" is due ${new Date(a.deadline).toLocaleString()}.`,
          date: new Date(now),
          link: `/student/assignments/${a.id}`,
        });
      }
    }
  });

  mySubmissions
    .filter((s) => s.status === "Graded" && s.gradedAt)
    .forEach((s) => {
      items.push({
        id: `graded-${s.id}`,
        type: "assignment_graded",
        title: "Assignment graded",
        message: `"${s.assignmentTitle}" was graded: ${s.marks}/${s.maxMarks}.`,
        date: new Date(s.gradedAt!),
        link: `/student/assignments/${s.assignmentId}`,
      });
    });

  return items;
}

async function computeForTeacher(teacherId: string): Promise<NotificationItem[]> {
  const [assignments, teacherAssignments, announcements] = await Promise.all([
    assignmentsApi.getAll(),
    teacherAssignmentsApi.getAll(teacherId),
    announcementsApi.getAll(),
  ]);

  const items: NotificationItem[] = [...announcementItems(announcements)];
  const now = Date.now();

  teacherAssignments.forEach((ta) => {
    const date = dateFromObjectId(ta.id);
    if (now - date.getTime() < RECENT_WINDOW_MS) {
      items.push({
        id: `assigned-${ta.id}`,
        type: "teacher_assigned",
        title: "New teaching assignment",
        message: `You were assigned to teach ${ta.subjectName} in ${ta.className}.`,
        date,
        link: "/teacher",
      });
    }
  });

  const withSubmissions = assignments.filter((a) => a.submissionCount > 0);
  const submissionLists = await Promise.all(withSubmissions.map((a) => submissionsApi.getByAssignment(a.id)));

  submissionLists.flat().forEach((s) => {
    if (now - new Date(s.submittedAt).getTime() < RECENT_WINDOW_MS) {
      items.push({
        id: `received-${s.id}`,
        type: "submission_received",
        title: "New submission received",
        message: `${s.studentName} submitted "${s.assignmentTitle}".`,
        date: new Date(s.submittedAt),
        link: `/teacher/assignments/${s.assignmentId}`,
      });
    }
  });

  return items;
}

async function computeForAdmin(): Promise<NotificationItem[]> {
  const announcements = await announcementsApi.getAll();
  return announcementItems(announcements);
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const computed =
        user.role === "Student"
          ? await computeForStudent()
          : user.role === "Teacher"
            ? await computeForTeacher(user.id)
            : await computeForAdmin();

      computed.sort((a, b) => b.date.getTime() - a.date.getTime());
      setItems(computed.slice(0, 30));
      setReadIds(loadReadIds(user.id));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(
    (id: string) => {
      if (!user) return;
      setReadIds((prev) => {
        const next = new Set(prev).add(id);
        saveReadIds(user.id, next);
        return next;
      });
    },
    [user]
  );

  const markAllRead = useCallback(() => {
    if (!user) return;
    setReadIds((prev) => {
      const next = new Set(prev);
      items.forEach((i) => next.add(i.id));
      saveReadIds(user.id, next);
      return next;
    });
  }, [user, items]);

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;

  return { items, readIds, unreadCount, loading, markRead, markAllRead, reload: load };
}
