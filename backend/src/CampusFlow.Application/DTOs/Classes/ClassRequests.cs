namespace CampusFlow.Application.DTOs.Classes;

public record CreateClassRequest(string Name, string? Description);

public record UpdateClassRequest(string Name, string? Description);
