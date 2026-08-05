export type UserRole = "Admin" | "Teacher" | "Student";

export type AssignmentStatus = "Draft" | "Published";

export type SubmissionStatus = "Submitted" | "Late" | "NeedsRevision" | "Graded";

export type EventType = "Exam" | "Holiday" | "Meeting" | "Other";

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  classId: string | null;
  className: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserDto;
}

export interface ClassDto {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

export interface SubjectDto {
  id: string;
  name: string;
  code: string;
  classId: string;
  className: string | null;
}

export interface TeacherAssignmentDto {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
}

export interface SubmissionSummaryDto {
  id: string;
  status: SubmissionStatus;
  marks: number | null;
  submittedAt: string;
}

export interface AssignmentDto {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  deadline: string;
  maxMarks: number;
  status: AssignmentStatus;
  allowResubmission: boolean;
  createdAt: string;
  updatedAt: string | null;
  submissionCount: number;
  mySubmission: SubmissionSummaryDto | null;
}

export interface SubmissionDto {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  answerText: string;
  attachmentUrl: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  marks: number | null;
  maxMarks: number;
  feedback: string | null;
  gradedAt: string | null;
  updatedAt: string | null;
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  type: EventType;
  startDate: string;
  endDate: string | null;
  classId: string | null;
  className: string | null;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  message: string;
  targetRole: UserRole | null;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface AiStatusDto {
  enabled: boolean;
}

export interface GeneratedAssignmentDto {
  title: string;
  description: string;
  requirements: string;
  instructions: string;
  expectedOutcome: string;
  gradingRubric: string;
}

export interface GeneratedFeedbackDto {
  suggestions: string[];
}

export interface ApiErrorResponse {
  status: number;
  title: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}
