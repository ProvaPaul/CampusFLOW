using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Users;

public record CreateUserRequest(
    string FullName,
    string Email,
    string Password,
    UserRole Role,
    string? ClassId);
