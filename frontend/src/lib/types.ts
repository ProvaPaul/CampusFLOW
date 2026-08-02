export type UserRole = "Admin" | "Teacher" | "Student";

export type AssignmentStatus = "Draft" | "Published";

export type SubmissionStatus = "Submitted" | "Late" | "NeedsRevision" | "Graded";

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  classId: string | null;
  className: string | null;
  isActive: boolean;
  createdAt: string;
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
  answerText: string;
  attachmentUrl: string | null;
  submittedAt: string;
  status: SubmissionStatus;
  marks: number | null;
  maxMarks: number;
  feedback: string | null;
  gradedAt: string | null;
}

export interface ApiErrorResponse {
  status: number;
  title: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}
