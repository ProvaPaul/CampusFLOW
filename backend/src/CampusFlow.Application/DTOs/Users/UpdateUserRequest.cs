namespace CampusFlow.Application.DTOs.Users;

public record UpdateUserRequest(
    string FullName,
    string? ClassId,
    bool IsActive);
