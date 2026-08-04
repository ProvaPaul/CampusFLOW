using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Submissions;

public record SubmissionDto(
    string Id,
    string AssignmentId,
    string AssignmentTitle,
    string StudentId,
    string StudentName,
    string StudentEmail,
    string AnswerText,
    string? AttachmentUrl,
    DateTime SubmittedAt,
    SubmissionStatus Status,
    double? Marks,
    int MaxMarks,
    string? Feedback,
    DateTime? GradedAt,
    DateTime? UpdatedAt);
