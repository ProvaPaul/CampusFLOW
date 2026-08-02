using CampusFlow.Application.DTOs.Subjects;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

[ApiController]
[Route("api/subjects")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
        _subjectService = subjectService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SubjectDto>>> GetAll([FromQuery] string? classId, CancellationToken ct) =>
        Ok(await _subjectService.GetAllAsync(classId, ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<SubjectDto>> GetById(string id, CancellationToken ct) => Ok(await _subjectService.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<SubjectDto>> Create(CreateSubjectRequest request, CancellationToken ct)
    {
        var created = await _subjectService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<SubjectDto>> Update(string id, UpdateSubjectRequest request, CancellationToken ct) =>
        Ok(await _subjectService.UpdateAsync(id, request, ct));

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _subjectService.DeleteAsync(id, ct);
        return NoContent();
    }
}
