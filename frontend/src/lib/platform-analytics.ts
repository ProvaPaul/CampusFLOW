import { format, subDays, subMonths, subWeeks } from "date-fns";
import type { AssignmentDto, ClassDto, SubmissionDto, UserDto } from "./types";

/**
 * Feeds the tabbed /admin/analytics page. Deliberately kept separate from admin-analytics.ts
 * (which powers the dashboard's Quick Insights / Smart Insights / charts) so each module stays
 * focused — this one is a set of "deep dive" breakdowns, all computed client-side from the same
 * existing endpoints, no new backend surface.
 */

export interface AssignmentAnalytics {
  published: number;
  draft: number;
  averageMarks: number | null;
  completionRate: number | null;
}

export interface TrendPoint {
  label: string;
  count: number;
}

export interface SubmissionAnalytics {
  daily: TrendPoint[];
  weekly: TrendPoint[];
  monthly: TrendPoint[];
}

export interface TeacherAnalyticsRow {
  teacherId: string;
  teacherName: string;
  assignmentsCreated: number;
  pendingReviews: number;
  averageGradingHours: number | null;
}

export interface StudentAnalyticsRow {
  studentId: string;
  studentName: string;
  averageScore: number | null;
  submissionRate: number | null;
  lateCount: number;
}

export interface ClassAnalyticsRow {
  classId: string;
  className: string;
  averageMarks: number | null;
  completionPercentage: number | null;
  activeStudents: number;
}

export interface PlatformAnalytics {
  assignment: AssignmentAnalytics;
  submission: SubmissionAnalytics;
  teachers: TeacherAnalyticsRow[];
  students: StudentAnalyticsRow[];
  classes: ClassAnalyticsRow[];
}

interface ComputeInput {
  classes: ClassDto[];
  users: UserDto[];
  assignments: AssignmentDto[];
  submissionsByAssignment: Record<string, SubmissionDto[]>;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

function bucketize(submissions: SubmissionDto[], buckets: Array<{ label: string; from: Date; to: Date }>): TrendPoint[] {
  return buckets.map(({ label, from, to }) => ({
    label,
    count: submissions.filter((s) => {
      const t = new Date(s.submittedAt).getTime();
      return t >= from.getTime() && t < to.getTime();
    }).length,
  }));
}

export function computePlatformAnalytics(input: ComputeInput): PlatformAnalytics {
  const { classes, users, assignments, submissionsByAssignment } = input;
  const allSubmissions = Object.values(submissionsByAssignment).flat();
  const gradedSubmissions = allSubmissions.filter((s) => s.status === "Graded" && s.marks !== null);

  const published = assignments.filter((a) => a.status === "Published").length;
  const draft = assignments.filter((a) => a.status === "Draft").length;
  const averageMarks = average(gradedSubmissions.map((s) => (s.marks! / s.maxMarks) * 100));

  const students = users.filter((u) => u.role === "Student");
  const publishedByClass = new Map<string, number>();
  assignments.filter((a) => a.status === "Published").forEach((a) => publishedByClass.set(a.classId, (publishedByClass.get(a.classId) ?? 0) + 1));
  const studentsByClass = new Map<string, number>();
  students.forEach((s) => {
    if (s.classId) studentsByClass.set(s.classId, (studentsByClass.get(s.classId) ?? 0) + 1);
  });
  let expectedTotal = 0;
  let actualTotal = 0;
  classes.forEach((c) => {
    const expectedPerStudent = publishedByClass.get(c.id) ?? 0;
    const studentCount = studentsByClass.get(c.id) ?? 0;
    expectedTotal += expectedPerStudent * studentCount;
  });
  assignments.forEach((a) => {
    actualTotal += a.submissionCount;
  });
  const completionRate = expectedTotal > 0 ? Math.min(100, Math.round((actualTotal / expectedTotal) * 100)) : null;

  const assignment: AssignmentAnalytics = { published, draft, averageMarks, completionRate };

  const now = new Date();
  const daily = bucketize(
    allSubmissions,
    Array.from({ length: 14 }, (_, i) => {
      const day = subDays(now, 13 - i);
      return { label: format(day, "MMM d"), from: new Date(day.setHours(0, 0, 0, 0)), to: new Date(day.setHours(23, 59, 59, 999)) };
    })
  );
  const weekly = bucketize(
    allSubmissions,
    Array.from({ length: 8 }, (_, i) => {
      const weekStart = subWeeks(now, 7 - i);
      const from = subDays(weekStart, weekStart.getDay());
      const to = subDays(from, -7);
      return { label: format(from, "MMM d"), from, to };
    })
  );
  const monthly = bucketize(
    allSubmissions,
    Array.from({ length: 6 }, (_, i) => {
      const monthDate = subMonths(now, 5 - i);
      const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
      return { label: format(from, "MMM yyyy"), from, to };
    })
  );

  const submission: SubmissionAnalytics = { daily, weekly, monthly };

  const teachers = users.filter((u) => u.role === "Teacher");
  const teacherRows: TeacherAnalyticsRow[] = teachers.map((teacher) => {
    const theirAssignments = assignments.filter((a) => a.teacherId === teacher.id);
    const theirAssignmentIds = new Set(theirAssignments.map((a) => a.id));
    const theirSubmissions = Object.entries(submissionsByAssignment)
      .filter(([assignmentId]) => theirAssignmentIds.has(assignmentId))
      .flatMap(([, subs]) => subs);
    const pendingReviews = theirSubmissions.filter((s) => s.status !== "Graded").length;
    const gradingHours = theirSubmissions
      .filter((s) => s.status === "Graded" && s.gradedAt)
      .map((s) => (new Date(s.gradedAt!).getTime() - new Date(s.submittedAt).getTime()) / (1000 * 60 * 60));

    return {
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      assignmentsCreated: theirAssignments.length,
      pendingReviews,
      averageGradingHours: gradingHours.length > 0 ? Math.round((gradingHours.reduce((sum, h) => sum + h, 0) / gradingHours.length) * 10) / 10 : null,
    };
  });

  const studentRows: StudentAnalyticsRow[] = students.map((student) => {
    const theirSubmissions = allSubmissions.filter((s) => s.studentId === student.id);
    const graded = theirSubmissions.filter((s) => s.status === "Graded" && s.marks !== null);
    const averageScore = average(graded.map((s) => (s.marks! / s.maxMarks) * 100));
    const expected = student.classId ? (publishedByClass.get(student.classId) ?? 0) : 0;
    const submissionRate = expected > 0 ? Math.min(100, Math.round((theirSubmissions.length / expected) * 100)) : null;
    const lateCount = theirSubmissions.filter((s) => s.status === "Late").length;

    return { studentId: student.id, studentName: student.fullName, averageScore, submissionRate, lateCount };
  });

  const classRows: ClassAnalyticsRow[] = classes.map((c) => {
    const classAssignmentIds = new Set(assignments.filter((a) => a.classId === c.id).map((a) => a.id));
    const classSubmissions = Object.entries(submissionsByAssignment)
      .filter(([assignmentId]) => classAssignmentIds.has(assignmentId))
      .flatMap(([, subs]) => subs);
    const classGraded = classSubmissions.filter((s) => s.status === "Graded" && s.marks !== null);
    const averageMarksForClass = average(classGraded.map((s) => (s.marks! / s.maxMarks) * 100));

    const expectedPerStudent = publishedByClass.get(c.id) ?? 0;
    const studentCount = studentsByClass.get(c.id) ?? 0;
    const expected = expectedPerStudent * studentCount;
    const actual = assignments.filter((a) => a.classId === c.id).reduce((sum, a) => sum + a.submissionCount, 0);
    const completionPercentage = expected > 0 ? Math.min(100, Math.round((actual / expected) * 100)) : null;

    return { classId: c.id, className: c.name, averageMarks: averageMarksForClass, completionPercentage, activeStudents: studentCount };
  });

  return { assignment, submission, teachers: teacherRows, students: studentRows, classes: classRows };
}
