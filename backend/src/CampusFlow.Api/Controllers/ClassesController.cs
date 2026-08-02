using CampusFlow.Application.DTOs.Classes;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClassDto>>> GetAll(CancellationToken ct) => Ok(await _classService.GetAllAsync(ct));

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassDto>> GetById(string id, CancellationToken ct) => Ok(await _classService.GetByIdAsync(id, ct));

    [HttpPost]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ClassDto>> Create(CreateClassRequest request, CancellationToken ct)
    {
        var created = await _classService.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<ActionResult<ClassDto>> Update(string id, UpdateClassRequest request, CancellationToken ct) =>
        Ok(await _classService.UpdateAsync(id, request, ct));

    [HttpDelete("{id}")]
    [Authorize(Roles = nameof(UserRole.Admin))]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await _classService.DeleteAsync(id, ct);
        return NoContent();
    }
}
