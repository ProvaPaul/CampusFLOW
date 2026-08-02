import { apiClient } from "./api-client";
import type {
  AssignmentDto,
  AssignmentStatus,
  AuthResponse,
  ClassDto,
  SubjectDto,
  SubmissionDto,
  SubmissionStatus,
  TeacherAssignmentDto,
  UserDto,
  UserRole,
} from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>("/api/auth/login", { email, password }).then((r) => r.data),
  me: () => apiClient.get<UserDto>("/api/users/me").then((r) => r.data),
};

export interface CreateUserPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  classId?: string | null;
}

export interface UpdateUserPayload {
  fullName: string;
  classId?: string | null;
  isActive: boolean;
}

export const usersApi = {
  getAll: () => apiClient.get<UserDto[]>("/api/users").then((r) => r.data),
  getById: (id: string) => apiClient.get<UserDto>(`/api/users/${id}`).then((r) => r.data),
  create: (payload: CreateUserPayload) => apiClient.post<UserDto>("/api/users", payload).then((r) => r.data),
  update: (id: string, payload: UpdateUserPayload) => apiClient.put<UserDto>(`/api/users/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/users/${id}`),
};

export const classesApi = {
  getAll: () => apiClient.get<ClassDto[]>("/api/classes").then((r) => r.data),
  create: (payload: { name: string; description?: string }) =>
    apiClient.post<ClassDto>("/api/classes", payload).then((r) => r.data),
  update: (id: string, payload: { name: string; description?: string }) =>
    apiClient.put<ClassDto>(`/api/classes/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/classes/${id}`),
};

export const subjectsApi = {
  getAll: (classId?: string) =>
    apiClient.get<SubjectDto[]>("/api/subjects", { params: classId ? { classId } : {} }).then((r) => r.data),
  create: (payload: { name: string; code: string; classId: string }) =>
    apiClient.post<SubjectDto>("/api/subjects", payload).then((r) => r.data),
  update: (id: string, payload: { name: string; code: string }) =>
    apiClient.put<SubjectDto>(`/api/subjects/${id}`, payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/subjects/${id}`),
};

export const teacherAssignmentsApi = {
  getAll: (teacherId?: string) =>
    apiClient
      .get<TeacherAssignmentDto[]>("/api/teacher-assignments", { params: teacherId ? { teacherId } : {} })
      .then((r) => r.data),
  create: (payload: { teacherId: string; subjectId: string; classId: string }) =>
    apiClient.post<TeacherAssignmentDto>("/api/teacher-assignments", payload).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/teacher-assignments/${id}`),
};

export interface CreateAssignmentPayload {
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  deadline: string;
  maxMarks: number;
  allowResubmission: boolean;
  publishImmediately: boolean;
}

export interface UpdateAssignmentPayload {
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  allowResubmission: boolean;
}

export const assignmentsApi = {
  getAll: () => apiClient.get<AssignmentDto[]>("/api/assignments").then((r) => r.data),
  getById: (id: string) => apiClient.get<AssignmentDto>(`/api/assignments/${id}`).then((r) => r.data),
  create: (payload: CreateAssignmentPayload) => apiClient.post<AssignmentDto>("/api/assignments", payload).then((r) => r.data),
  update: (id: string, payload: UpdateAssignmentPayload) =>
    apiClient.put<AssignmentDto>(`/api/assignments/${id}`, payload).then((r) => r.data),
  updateStatus: (id: string, status: AssignmentStatus) =>
    apiClient.patch<AssignmentDto>(`/api/assignments/${id}/status`, { status }).then((r) => r.data),
  remove: (id: string) => apiClient.delete(`/api/assignments/${id}`),
};

export const submissionsApi = {
  submit: (assignmentId: string, payload: { answerText: string; attachmentUrl?: string | null }) =>
    apiClient.post<SubmissionDto>(`/api/assignments/${assignmentId}/submissions`, payload).then((r) => r.data),
  update: (id: string, payload: { answerText: string; attachmentUrl?: string | null }) =>
    apiClient.put<SubmissionDto>(`/api/submissions/${id}`, payload).then((r) => r.data),
  getById: (id: string) => apiClient.get<SubmissionDto>(`/api/submissions/${id}`).then((r) => r.data),
  getByAssignment: (assignmentId: string) =>
    apiClient.get<SubmissionDto[]>(`/api/assignments/${assignmentId}/submissions`).then((r) => r.data),
  getMy: () => apiClient.get<SubmissionDto[]>("/api/submissions/my").then((r) => r.data),
  grade: (id: string, payload: { marks: number; feedback?: string | null }) =>
    apiClient.patch<SubmissionDto>(`/api/submissions/${id}/grade`, payload).then((r) => r.data),
  updateStatus: (id: string, status: SubmissionStatus) =>
    apiClient.patch<SubmissionDto>(`/api/submissions/${id}/status`, { status }).then((r) => r.data),
};
