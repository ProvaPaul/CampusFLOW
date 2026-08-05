using CampusFlow.Application.DTOs.Events;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

/// <summary>Academic calendar entries (exams, holidays, meetings) — assignment deadlines are merged in client-side.</summary>
[ApiController]
[Route("api/events")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<ActionResult<List<EventDto>>> GetAll(CancellationToken ct) => Ok(await _eventService.GetAllAsync(ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<EventDto>> Create(CreateEventRequest request, CancellationToken ct) =>
        Ok(await _eventService.CreateAsync(request, ct));

    [HttpPut("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<EventDto>> Update(string id, UpdateEventRequest request, CancellationToken ct) =>
        Ok(await _eventService.UpdateAsync(id, request, ct));

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _eventService.DeleteAsync(id, ct);
        return NoContent();
    }
}
