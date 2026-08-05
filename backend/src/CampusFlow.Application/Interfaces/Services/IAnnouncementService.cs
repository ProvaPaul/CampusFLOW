using CampusFlow.Application.DTOs.Announcements;

namespace CampusFlow.Application.Interfaces.Services;

public interface IAnnouncementService
{
    /// <summary>Admin sees every announcement; Teacher/Student see school-wide plus ones targeted at their own role.</summary>
    Task<List<AnnouncementDto>> GetAllAsync(CancellationToken ct = default);

    Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
