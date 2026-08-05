using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Events;

public record EventDto(
    string Id,
    string Title,
    string Description,
    EventType Type,
    DateTime StartDate,
    DateTime? EndDate,
    string? ClassId,
    string? ClassName,
    string CreatedByUserId,
    string CreatedByName,
    DateTime CreatedAt);
