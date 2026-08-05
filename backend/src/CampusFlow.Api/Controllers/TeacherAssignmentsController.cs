using CampusFlow.Application.DTOs.TeacherAssignments;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

/// <summary>
/// Assigning teachers to a subject within a class/course is Admin-only, but a teacher needs to be
/// able to read their own assignments (which subject/class they may create work for) — the New
/// Assignment page depends on this. Reads are open to Admin and Teacher; writes stay Admin-only.
/// </summary>
[ApiController]
[Route("api/teacher-assignments")]
[Authorize]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly ITeacherAssignmentService _teacherAssignmentService;

    public TeacherAssignmentsController(ITeacherAssignmentService teacherAssignmentService)
    {
        _teacherAssignmentService = teacherAssignmentService;
    }

    [HttpGet]
    [Authorize(Roles = $"{nameof(UserRole.Admin)},{nameof(UserRole.Teacher)}")]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetAll([FromQuery] string? teacherId, CancellationToken ct) =>
        Ok(await _teacherAssignmentService.GetAllAsync(teacherId, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<TeacherAssignmentDto>> Create(CreateTeacherAssignmentRequest request, CancellationToken ct)
    {
        var created = await _teacherAssignmentService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), created);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _teacherAssignmentService.DeleteAsync(id, ct);
        return NoContent();
    }
}
