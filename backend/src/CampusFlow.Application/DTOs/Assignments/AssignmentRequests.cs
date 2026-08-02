using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Assignments;

public record CreateAssignmentRequest(
    string Title,
    string Description,
    string ClassId,
    string SubjectId,
    DateTime Deadline,
    int MaxMarks,
    bool AllowResubmission,
    bool PublishImmediately);

public record UpdateAssignmentRequest(
    string Title,
    string Description,
    DateTime Deadline,
    int MaxMarks,
    bool AllowResubmission);

public record UpdateAssignmentStatusRequest(AssignmentStatus Status);
