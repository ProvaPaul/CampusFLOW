using CampusFlow.Application.DTOs.Assignments;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;

    public AssignmentsController(IAssignmentService assignmentService)
    {
        _assignmentService = assignmentService;
    }

    /// <summary>Returns assignments visible to the caller: all for Admin, own for Teacher, published+own-class for Student.</summary>
    [HttpGet]
    public async Task<ActionResult<List<AssignmentDto>>> GetAll(CancellationToken ct) => Ok(await _assignmentService.GetAllAsync(ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<AssignmentDto>> GetById(string id, CancellationToken ct) => Ok(await _assignmentService.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<AssignmentDto>> Create(CreateAssignmentRequest request, CancellationToken ct)
    {
        var created = await _assignmentService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<AssignmentDto>> Update(string id, UpdateAssignmentRequest request, CancellationToken ct) =>
        Ok(await _assignmentService.UpdateAsync(id, request, ct));

    /// <summary>Publishes a draft assignment or reverts a published one back to draft.</summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<AssignmentDto>> UpdateStatus(string id, UpdateAssignmentStatusRequest request, CancellationToken ct) =>
        Ok(await _assignmentService.UpdateStatusAsync(id, request.Status, ct));

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(UserRole.Teacher)},{nameof(UserRole.Admin)}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _assignmentService.DeleteAsync(id, ct);
        return NoContent();
    }
}
