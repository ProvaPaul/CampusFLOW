using CampusFlow.Application.DTOs.Submissions;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusFlow.Api.Controllers;

[ApiController]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public SubmissionsController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    /// <summary>Student submits an answer for a published assignment in their own class.</summary>
    [HttpPost("api/assignments/{assignmentId}/submissions")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<ActionResult<SubmissionDto>> Submit(string assignmentId, CreateSubmissionRequest request, CancellationToken ct)
    {
        var created = await _submissionService.SubmitAsync(assignmentId, request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Teacher (assignment owner) or Admin views all submissions for an assignment.</summary>
    [HttpGet("api/assignments/{assignmentId}/submissions")]
    [Authorize(Roles = $"{nameof(UserRole.Teacher)},{nameof(UserRole.Admin)}")]
    public async Task<ActionResult<List<SubmissionDto>>> GetByAssignment(string assignmentId, CancellationToken ct) =>
        Ok(await _submissionService.GetByAssignmentAsync(assignmentId, ct));

    /// <summary>Current student's own submissions across all assignments.</summary>
    [HttpGet("api/submissions/my")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<ActionResult<List<SubmissionDto>>> GetMy(CancellationToken ct) => Ok(await _submissionService.GetMyAsync(ct));

    [HttpGet("api/submissions/{id}")]
    public async Task<ActionResult<SubmissionDto>> GetById(string id, CancellationToken ct) => Ok(await _submissionService.GetByIdAsync(id, ct));

    /// <summary>Student updates their own submission before the deadline, if the teacher allows resubmission.</summary>
    [HttpPut("api/submissions/{id}")]
    [Authorize(Roles = nameof(UserRole.Student))]
    public async Task<ActionResult<SubmissionDto>> Update(string id, UpdateSubmissionRequest request, CancellationToken ct) =>
        Ok(await _submissionService.UpdateAsync(id, request, ct));

    /// <summary>Teacher (assignment owner) assigns marks and feedback.</summary>
    [HttpPatch("api/submissions/{id}/grade")]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<SubmissionDto>> Grade(string id, GradeSubmissionRequest request, CancellationToken ct) =>
        Ok(await _submissionService.GradeAsync(id, request, ct));

    /// <summary>Teacher (assignment owner) changes a submission's status, e.g. requesting revision.</summary>
    [HttpPatch("api/submissions/{id}/status")]
    [Authorize(Roles = nameof(UserRole.Teacher))]
    public async Task<ActionResult<SubmissionDto>> UpdateStatus(string id, UpdateSubmissionStatusRequest request, CancellationToken ct) =>
        Ok(await _submissionService.UpdateStatusAsync(id, request.Status, ct));
}
