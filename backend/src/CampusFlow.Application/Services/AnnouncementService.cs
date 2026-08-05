using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Announcements;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IAnnouncementRepository _announcementRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<AnnouncementService> _logger;

    public AnnouncementService(
        IAnnouncementRepository announcementRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        ILogger<AnnouncementService> logger)
    {
        _announcementRepository = announcementRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<List<AnnouncementDto>> GetAllAsync(CancellationToken ct = default)
    {
        var announcements = _currentUser.Role == UserRole.Admin
            ? await _announcementRepository.GetAllAsync(ct)
            : await _announcementRepository.FindAsync(a => a.TargetRole == null || a.TargetRole == _currentUser.Role, ct);

        return await ToDtosAsync(announcements.OrderByDescending(a => a.CreatedAt).ToList(), ct);
    }

    public async Task<AnnouncementDto> CreateAsync(CreateAnnouncementRequest request, CancellationToken ct = default)
    {
        var announcement = new Announcement
        {
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            TargetRole = request.TargetRole,
            CreatedByUserId = _currentUser.UserId
        };

        await _announcementRepository.CreateAsync(announcement, ct);
        _logger.LogInformation("Admin {UserId} posted announcement {AnnouncementId}", _currentUser.UserId, announcement.Id);

        return (await ToDtosAsync(new List<Announcement> { announcement }, ct)).Single();
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        _ = await _announcementRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Announcement), id);
        await _announcementRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Admin {UserId} deleted announcement {AnnouncementId}", _currentUser.UserId, id);
    }

    private async Task<List<AnnouncementDto>> ToDtosAsync(List<Announcement> announcements, CancellationToken ct)
    {
        if (announcements.Count == 0)
        {
            return new List<AnnouncementDto>();
        }

        var users = (await _userRepository.GetAllAsync(ct)).ToDictionary(u => u.Id, u => u.FullName);

        return announcements.Select(a => new AnnouncementDto(
            a.Id,
            a.Title,
            a.Message,
            a.TargetRole,
            a.CreatedByUserId,
            users.GetValueOrDefault(a.CreatedByUserId, "Unknown"),
            a.CreatedAt)).ToList();
    }
}
