namespace CampusFlow.Application.DTOs.Subjects;

public record CreateSubjectRequest(string Name, string Code, string ClassId);

public record UpdateSubjectRequest(string Name, string Code);
