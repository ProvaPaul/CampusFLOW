import { format, isPast } from "date-fns";
import { dateFromObjectId } from "./object-id";
import type { AssignmentDto, ClassDto, SubjectDto, SubmissionDto, TeacherAssignmentDto, UserDto } from "./types";

/**
 * Everything below is computed purely from data the existing API endpoints already
 * return (plus MongoDB ObjectId timestamps for the couple of DTOs that don't expose
 * their own createdAt). No new backend endpoints or fields — see README "Assumptions"
 * for the reasoning behind each computed/inferred value.
 */

export type EntityStatus = "Active" | "Needs Teacher" | "No Assignments" | "Setting Up" | "Empty";

export interface GlobalStats {
  totalClasses: number;
  totalSubjects: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalAssignments: number;
  draftAssignments: number;
  publishedAssignments: number;
  pendingReviews: number;
  completedSubmissions: number;
}

export interface ChartData {
  assignmentStatus: Array<{ name: string; value: number }>;
  userDistribution: Array<{ name: string; value: number }>;
  submissionTrend: Array<{ date: string; submissions: number }>;
  classActivity: Array<{ name: string; assignments: number; submissionRate: number }>;
}

export interface SubjectInsight {
  subject: SubjectDto;
  assignedTeachers: number;
  enrolledStudents: number;
  assignmentsCount: number;
  activeAssignmentsCount: number;
  draftAssignmentsCount: number;
  /** 0-100, or null when there isn't enough data (no published assignments yet). */
  submissionRate: number | null;
  status: EntityStatus;
  lastActivity: Date | null;
  createdAt: Date;
}

export interface ClassInsight {
  classItem: ClassDto;
  totalStudents: number;
  totalSubjects: number;
  assignedTeachers: number;
  activeAssignments: number;
  pendingAssignments: number;
  averageSubmissionRate: number | null;
  lastActivity: Date | null;
  academicLevel: string;
  sectionLabel: string;
  status: EntityStatus;
}

export type ActivityType =
  | "class_created"
  | "subject_created"
  | "teacher_assigned"
  | "assignment_created"
  | "assignment_published"
  | "submission_received"
  | "submission_graded";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  date: Date;
  text: string;
}

export interface QuickInsights {
  mostActiveSubject: { subject: SubjectDto; submissions: number } | null;
  topSubmissionRateClass: { classItem: ClassDto; rate: number } | null;
  upcomingDeadlines: AssignmentDto[];
  subjectsWithoutTeacher: SubjectDto[];
  classesWithoutSubjects: ClassDto[];
  draftAssignments: AssignmentDto[];
}

export interface AdminAnalytics {
  global: GlobalStats;
  subjects: SubjectInsight[];
  classes: ClassInsight[];
  activity: ActivityEvent[];
  insights: QuickInsights;
  charts: ChartData;
}

interface ComputeInput {
  classes: ClassDto[];
  subjects: SubjectDto[];
  users: UserDto[];
  teacherAssignments: TeacherAssignmentDto[];
  assignments: AssignmentDto[];
  /** Keyed by assignmentId — only populated for assignments with submissionCount > 0. */
  submissionsByAssignment: Record<string, SubmissionDto[]>;
}

function inferClassMeta(name: string): { academicLevel: string; sectionLabel: string } {
  const lower = name.toLowerCase();
  let academicLevel = "School";
  if (/\b(bsc|ba|bba|bachelor|university|undergrad|semester)\b/.test(lower)) {
    academicLevel = "University";
  } else if (/\bcollege\b/.test(lower)) {
    academicLevel = "College";
  }

  const parts = name.split(" - ");
  const sectionLabel = parts.length > 1 ? parts[1].trim() : "—";

  return { academicLevel, sectionLabel };
}

function latestOf(dates: Array<Date | null | undefined>): Date | null {
  const valid = dates.filter((d): d is Date => !!d);
  if (valid.length === 0) return null;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

/**
 * Submissions are counted against the class's *current* roster, so if a student
 * changes class after submitting, actual submissions can outnumber the current
 * expected total. Clamp at 100% — a rate above that isn't meaningful to show.
 */
function computeRate(actual: number, expected: number): number | null {
  if (expected <= 0) return null;
  return Math.min(100, Math.round((actual / expected) * 100));
}

export function computeAdminAnalytics(input: ComputeInput): AdminAnalytics {
  const { classes, subjects, users, teacherAssignments, assignments, submissionsByAssignment } = input;

  const students = users.filter((u) => u.role === "Student");
  const teachers = users.filter((u) => u.role === "Teacher");
  const admins = users.filter((u) => u.role === "Admin");

  const draftAssignments = assignments.filter((a) => a.status === "Draft");
  const publishedAssignments = assignments.filter((a) => a.status === "Published");

  let pendingReviews = 0;
  let completedSubmissions = 0;
  for (const subs of Object.values(submissionsByAssignment)) {
    for (const s of subs) {
      if (s.status === "Graded") completedSubmissions++;
      else pendingReviews++;
    }
  }

  const global: GlobalStats = {
    totalClasses: classes.length,
    totalSubjects: subjects.length,
    totalAdmins: admins.length,
    totalTeachers: teachers.length,
    totalStudents: students.length,
    totalAssignments: assignments.length,
    draftAssignments: draftAssignments.length,
    publishedAssignments: publishedAssignments.length,
    pendingReviews,
    completedSubmissions,
  };

  const subjectInsights: SubjectInsight[] = subjects.map((subject) => {
    const subjectTeacherLinks = teacherAssignments.filter((ta) => ta.subjectId === subject.id);
    const assignedTeachers = new Set(subjectTeacherLinks.map((ta) => ta.teacherId)).size;
    const enrolledStudents = students.filter((s) => s.classId === subject.classId).length;
    const subjectAssignments = assignments.filter((a) => a.subjectId === subject.id);
    const activeAssignmentsCount = subjectAssignments.filter((a) => a.status === "Published").length;
    const draftAssignmentsCount = subjectAssignments.filter((a) => a.status === "Draft").length;

    const totalSubmissions = subjectAssignments.reduce((sum, a) => sum + a.submissionCount, 0);
    const submissionRate = computeRate(totalSubmissions, enrolledStudents * activeAssignmentsCount);

    const lastActivity = latestOf(
      subjectAssignments.flatMap((a) => [new Date(a.createdAt), a.updatedAt ? new Date(a.updatedAt) : null])
    );

    let status: EntityStatus = "Active";
    if (assignedTeachers === 0) status = "Needs Teacher";
    else if (subjectAssignments.length === 0) status = "No Assignments";

    return {
      subject,
      assignedTeachers,
      enrolledStudents,
      assignmentsCount: subjectAssignments.length,
      activeAssignmentsCount,
      draftAssignmentsCount,
      submissionRate,
      status,
      lastActivity,
      createdAt: dateFromObjectId(subject.id),
    };
  });

  const classInsights: ClassInsight[] = classes.map((classItem) => {
    const totalStudents = students.filter((s) => s.classId === classItem.id).length;
    const classSubjects = subjects.filter((s) => s.classId === classItem.id);
    const classTeacherLinks = teacherAssignments.filter((ta) => ta.classId === classItem.id);
    const assignedTeachers = new Set(classTeacherLinks.map((ta) => ta.teacherId)).size;
    const classAssignments = assignments.filter((a) => a.classId === classItem.id);
    const activeAssignments = classAssignments.filter((a) => a.status === "Published").length;
    const pendingAssignments = classAssignments.filter((a) => a.status === "Draft").length;

    const totalSubmissions = classAssignments.reduce((sum, a) => sum + a.submissionCount, 0);
    const averageSubmissionRate = computeRate(totalSubmissions, totalStudents * activeAssignments);

    const lastActivity = latestOf(
      classAssignments.flatMap((a) => [new Date(a.createdAt), a.updatedAt ? new Date(a.updatedAt) : null])
    );

    const { academicLevel, sectionLabel } = inferClassMeta(classItem.name);

    let status: EntityStatus = "Active";
    if (classSubjects.length === 0) status = "Empty";
    else if (activeAssignments === 0) status = "Setting Up";

    return {
      classItem,
      totalStudents,
      totalSubjects: classSubjects.length,
      assignedTeachers,
      activeAssignments,
      pendingAssignments,
      averageSubmissionRate,
      lastActivity,
      academicLevel,
      sectionLabel,
      status,
    };
  });

  const activity: ActivityEvent[] = [];

  classes.forEach((c) =>
    activity.push({
      id: `class-${c.id}`,
      type: "class_created",
      date: new Date(c.createdAt),
      text: `Class "${c.name}" was created`,
    })
  );

  subjects.forEach((s) =>
    activity.push({
      id: `subject-${s.id}`,
      type: "subject_created",
      date: dateFromObjectId(s.id),
      text: `Subject "${s.name}" was added to ${s.className ?? "a class"}`,
    })
  );

  teacherAssignments.forEach((ta) =>
    activity.push({
      id: `ta-${ta.id}`,
      type: "teacher_assigned",
      date: dateFromObjectId(ta.id),
      text: `${ta.teacherName} was assigned to teach ${ta.subjectName} in ${ta.className}`,
    })
  );

  assignments.forEach((a) => {
    activity.push({
      id: `assignment-created-${a.id}`,
      type: "assignment_created",
      date: new Date(a.createdAt),
      text: `${a.teacherName} created "${a.title}" (${a.subjectName})`,
    });
    if (a.status === "Published" && a.updatedAt) {
      activity.push({
        id: `assignment-published-${a.id}`,
        type: "assignment_published",
        date: new Date(a.updatedAt),
        text: `"${a.title}" was published to ${a.className}`,
      });
    }
  });

  Object.values(submissionsByAssignment).forEach((subs) => {
    subs.forEach((s) => {
      activity.push({
        id: `submission-${s.id}`,
        type: "submission_received",
        date: new Date(s.submittedAt),
        text: `${s.studentName} submitted "${s.assignmentTitle}"`,
      });
      if (s.status === "Graded" && s.gradedAt) {
        activity.push({
          id: `graded-${s.id}`,
          type: "submission_graded",
          date: new Date(s.gradedAt),
          text: `${s.studentName}'s submission for "${s.assignmentTitle}" was graded (${s.marks}/${s.maxMarks})`,
        });
      }
    });
  });

  activity.sort((a, b) => b.date.getTime() - a.date.getTime());

  const mostActiveSubject = subjects.reduce<{ subject: SubjectDto; submissions: number } | null>((best, subject) => {
    const total = assignments.filter((a) => a.subjectId === subject.id).reduce((sum, a) => sum + a.submissionCount, 0);
    if (total === 0) return best;
    if (!best || total > best.submissions) return { subject, submissions: total };
    return best;
  }, null);

  const topSubmissionRateClass = classInsights.reduce<{ classItem: ClassDto; rate: number } | null>((best, ci) => {
    if (ci.averageSubmissionRate === null) return best;
    if (!best || ci.averageSubmissionRate > best.rate) return { classItem: ci.classItem, rate: ci.averageSubmissionRate };
    return best;
  }, null);

  const upcomingDeadlines = assignments
    .filter((a) => a.status === "Published" && !isPast(new Date(a.deadline)))
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4);

  const subjectsWithoutTeacher = subjects.filter((s) => !teacherAssignments.some((ta) => ta.subjectId === s.id));
  const classesWithoutSubjects = classes.filter((c) => !subjects.some((s) => s.classId === c.id));

  const insights: QuickInsights = {
    mostActiveSubject,
    topSubmissionRateClass,
    upcomingDeadlines,
    subjectsWithoutTeacher,
    classesWithoutSubjects,
    draftAssignments,
  };

  const allSubmissions = Object.values(submissionsByAssignment).flat();
  const trendDays = new Map<string, { label: string; count: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    trendDays.set(d.toDateString(), { label: format(d, "MMM d"), count: 0 });
  }
  allSubmissions.forEach((s) => {
    const key = new Date(s.submittedAt).toDateString();
    const bucket = trendDays.get(key);
    if (bucket) bucket.count += 1;
  });

  const charts: ChartData = {
    assignmentStatus: [
      { name: "Published", value: publishedAssignments.length },
      { name: "Draft", value: draftAssignments.length },
    ],
    userDistribution: [
      { name: "Students", value: students.length },
      { name: "Teachers", value: teachers.length },
      { name: "Admins", value: admins.length },
    ],
    submissionTrend: Array.from(trendDays.values()).map((v) => ({ date: v.label, submissions: v.count })),
    classActivity: classInsights.map((ci) => ({
      name: ci.classItem.name,
      assignments: ci.activeAssignments,
      submissionRate: ci.averageSubmissionRate ?? 0,
    })),
  };

  return { global, subjects: subjectInsights, classes: classInsights, activity: activity.slice(0, 12), insights, charts };
}
