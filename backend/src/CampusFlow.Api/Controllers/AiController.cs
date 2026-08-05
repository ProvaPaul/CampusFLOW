using CampusFlow.Application.DTOs.Ai;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

/// <summary>Optional AI-assisted authoring — gracefully reports itself disabled when no provider key is configured.</summary>
[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IAiService _aiService;

    public AiController(IAiService aiService)
    {
        _aiService = aiService;
    }

    /// <summary>Never exposes the key itself — just whether AI features are usable.</summary>
    [HttpGet("status")]
    public ActionResult<AiStatusDto> GetStatus() => Ok(new AiStatusDto(_aiService.IsEnabled));

    [HttpPost("generate-assignment")]
    [Authorize(Roles = $"{nameof(UserRole.Teacher)},{nameof(UserRole.Admin)}")]
    public async Task<ActionResult<GeneratedAssignmentDto>> GenerateAssignment(GenerateAssignmentRequest request, CancellationToken ct) =>
        Ok(await _aiService.GenerateAssignmentAsync(request, ct));

    [HttpPost("generate-feedback")]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<GeneratedFeedbackDto>> GenerateFeedback(GenerateFeedbackRequest request, CancellationToken ct) =>
        Ok(await _aiService.GenerateFeedbackAsync(request, ct));
}
