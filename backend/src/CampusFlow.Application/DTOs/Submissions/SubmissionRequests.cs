using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Submissions;

public record CreateSubmissionRequest(string AnswerText, string? AttachmentUrl);

public record UpdateSubmissionRequest(string AnswerText, string? AttachmentUrl);

public record GradeSubmissionRequest(double Marks, string? Feedback);

public record UpdateSubmissionStatusRequest(SubmissionStatus Status);
