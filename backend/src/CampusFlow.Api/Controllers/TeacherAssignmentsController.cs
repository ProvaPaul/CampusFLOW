using CampusFlow.Application.DTOs.TeacherAssignments;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

/// <summary>Admin-only endpoints for assigning teachers to a subject within a class/course.</summary>
[ApiController]
[Route("api/teacher-assignments")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly ITeacherAssignmentService _teacherAssignmentService;

    public TeacherAssignmentsController(ITeacherAssignmentService teacherAssignmentService)
    {
        _teacherAssignmentService = teacherAssignmentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TeacherAssignmentDto>>> GetAll([FromQuery] string? teacherId, CancellationToken ct) =>
        Ok(await _teacherAssignmentService.GetAllAsync(teacherId, ct));

    [HttpPost]
    public async Task<ActionResult<TeacherAssignmentDto>> Create(CreateTeacherAssignmentRequest request, CancellationToken ct)
    {
        var created = await _teacherAssignmentService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetAll), created);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _teacherAssignmentService.DeleteAsync(id, ct);
        return NoContent();
    }
}
