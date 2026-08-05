using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.DTOs.Events;

public record CreateEventRequest(
    string Title,
    string Description,
    EventType Type,
    DateTime StartDate,
    DateTime? EndDate,
    string? ClassId);

public record UpdateEventRequest(
    string Title,
    string Description,
    EventType Type,
    DateTime StartDate,
    DateTime? EndDate,
    string? ClassId);
