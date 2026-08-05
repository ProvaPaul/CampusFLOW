using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Users;

public record UserDto(
    string Id,
    string FullName,
    string Email,
    UserRole Role,
    string? ClassId,
    string? ClassName,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? LastLoginAt);
