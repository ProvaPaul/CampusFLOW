namespace CampusFlow.Application.DTOs.TeacherAssignments;

public record TeacherAssignmentDto(
    string Id,
    string TeacherId,
    string TeacherName,
    string SubjectId,
    string SubjectName,
    string ClassId,
    string ClassName);

public record CreateTeacherAssignmentRequest(string TeacherId, string SubjectId, string ClassId);
