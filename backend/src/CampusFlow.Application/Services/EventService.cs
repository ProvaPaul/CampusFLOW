using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Events;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class EventService : IEventService
{
    private readonly IEventRepository _eventRepository;
    private readonly IClassRepository _classRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<EventService> _logger;

    public EventService(
        IEventRepository eventRepository,
        IClassRepository classRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        ILogger<EventService> logger)
    {
        _eventRepository = eventRepository;
        _classRepository = classRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<List<EventDto>> GetAllAsync(CancellationToken ct = default)
    {
        List<Event> events;

        if (_currentUser.Role == UserRole.Student)
        {
            var student = await _userRepository.GetByIdAsync(_currentUser.UserId, ct)
                ?? throw new NotFoundException(nameof(User), _currentUser.UserId);

            events = await _eventRepository.FindAsync(
                e => e.ClassId == null || e.ClassId == student.ClassId, ct);
        }
        else
        {
            events = await _eventRepository.GetAllAsync(ct);
        }

        return await ToDtosAsync(events.OrderBy(e => e.StartDate).ToList(), ct);
    }

    public async Task<EventDto> CreateAsync(CreateEventRequest request, CancellationToken ct = default)
    {
        if (!string.IsNullOrEmpty(request.ClassId) && await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        var ev = new Event
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Type = request.Type,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            ClassId = request.ClassId,
            CreatedByUserId = _currentUser.UserId
        };

        await _eventRepository.CreateAsync(ev, ct);
        _logger.LogInformation("Admin {UserId} created event {EventId} ({Type})", _currentUser.UserId, ev.Id, ev.Type);

        return (await ToDtosAsync(new List<Event> { ev }, ct)).Single();
    }

    public async Task<EventDto> UpdateAsync(string id, UpdateEventRequest request, CancellationToken ct = default)
    {
        var ev = await GetOrThrowAsync(id, ct);

        if (!string.IsNullOrEmpty(request.ClassId) && await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        ev.Title = request.Title.Trim();
        ev.Description = request.Description.Trim();
        ev.Type = request.Type;
        ev.StartDate = request.StartDate;
        ev.EndDate = request.EndDate;
        ev.ClassId = request.ClassId;
        ev.UpdatedAt = DateTime.UtcNow;

        await _eventRepository.UpdateAsync(ev, ct);
        _logger.LogInformation("Admin {UserId} updated event {EventId}", _currentUser.UserId, id);

        return (await ToDtosAsync(new List<Event> { ev }, ct)).Single();
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        await GetOrThrowAsync(id, ct);
        await _eventRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Admin {UserId} deleted event {EventId}", _currentUser.UserId, id);
    }

    private async Task<Event> GetOrThrowAsync(string id, CancellationToken ct) =>
        await _eventRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Event), id);

    private async Task<List<EventDto>> ToDtosAsync(List<Event> events, CancellationToken ct)
    {
        if (events.Count == 0)
        {
            return new List<EventDto>();
        }

        var classes = (await _classRepository.GetAllAsync(ct)).ToDictionary(c => c.Id, c => c.Name);
        var users = (await _userRepository.GetAllAsync(ct)).ToDictionary(u => u.Id, u => u.FullName);

        return events.Select(e => new EventDto(
            e.Id,
            e.Title,
            e.Description,
            e.Type,
            e.StartDate,
            e.EndDate,
            e.ClassId,
            e.ClassId is not null ? classes.GetValueOrDefault(e.ClassId, "Unknown") : null,
            e.CreatedByUserId,
            users.GetValueOrDefault(e.CreatedByUserId, "Unknown"),
            e.CreatedAt)).ToList();
    }
}
