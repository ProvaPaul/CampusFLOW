using CampusFlow.Application.DTOs.Events;

namespace CampusFlow.Application.Interfaces.Services;

public interface IEventService
{
    /// <summary>Admin/Teacher see every event; Student sees school-wide events plus their own class's.</summary>
    Task<List<EventDto>> GetAllAsync(CancellationToken ct = default);

    Task<EventDto> CreateAsync(CreateEventRequest request, CancellationToken ct = default);

    Task<EventDto> UpdateAsync(string id, UpdateEventRequest request, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
