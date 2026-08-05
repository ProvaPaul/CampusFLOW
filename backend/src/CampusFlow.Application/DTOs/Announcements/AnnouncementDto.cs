using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Announcements;

public record AnnouncementDto(
    string Id,
    string Title,
    string Message,
    UserRole? TargetRole,
    string CreatedByUserId,
    string CreatedByName,
    DateTime CreatedAt);

public record CreateAnnouncementRequest(string Title, string Message, UserRole? TargetRole);
