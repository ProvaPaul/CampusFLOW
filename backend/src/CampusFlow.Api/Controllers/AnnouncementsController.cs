using CampusFlow.Application.DTOs.Announcements;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

/// <summary>Admin-authored broadcast messages, surfaced in every role's notification center.</summary>
[ApiController]
[Route("api/announcements")]
[Authorize]
public class AnnouncementsController : ControllerBase
{
    private readonly IAnnouncementService _announcementService;

    public AnnouncementsController(IAnnouncementService announcementService)
    {
        _announcementService = announcementService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AnnouncementDto>>> GetAll(CancellationToken ct) =>
        Ok(await _announcementService.GetAllAsync(ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<AnnouncementDto>> Create(CreateAnnouncementRequest request, CancellationToken ct) =>
        Ok(await _announcementService.CreateAsync(request, ct));

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _announcementService.DeleteAsync(id, ct);
        return NoContent();
    }
}
