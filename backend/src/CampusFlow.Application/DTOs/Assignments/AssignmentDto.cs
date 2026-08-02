using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Assignments;

public record AssignmentDto(
    string Id,
    string Title,
    string Description,
    string ClassId,
    string ClassName,
    string SubjectId,
    string SubjectName,
    string TeacherId,
    string TeacherName,
    DateTime Deadline,
    int MaxMarks,
    AssignmentStatus Status,
    bool AllowResubmission,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    int SubmissionCount,
    SubmissionSummaryDto? MySubmission);

/// <summary>Lightweight view of the current student's own submission, embedded on the assignment.</summary>
public record SubmissionSummaryDto(
    string Id,
    SubmissionStatus Status,
    double? Marks,
    DateTime SubmittedAt);
