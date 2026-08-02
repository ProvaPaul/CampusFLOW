using CampusFlow.Application.DTOs.Submissions;
using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.Interfaces.Services;

public interface ISubmissionService
{
    Task<SubmissionDto> SubmitAsync(string assignmentId, CreateSubmissionRequest request, CancellationToken ct = default);

    Task<SubmissionDto> UpdateAsync(string submissionId, UpdateSubmissionRequest request, CancellationToken ct = default);

    Task<SubmissionDto> GetByIdAsync(string submissionId, CancellationToken ct = default);

    Task<List<SubmissionDto>> GetByAssignmentAsync(string assignmentId, CancellationToken ct = default);

    Task<List<SubmissionDto>> GetMyAsync(CancellationToken ct = default);

    Task<SubmissionDto> GradeAsync(string submissionId, GradeSubmissionRequest request, CancellationToken ct = default);

    Task<SubmissionDto> UpdateStatusAsync(string submissionId, SubmissionStatus status, CancellationToken ct = default);
}
