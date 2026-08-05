using CampusFlow.Application.DTOs.Ai;

namespace CampusFlow.Application.Interfaces.Services;

public interface IAiService
{
    bool IsEnabled { get; }

    Task<GeneratedAssignmentDto> GenerateAssignmentAsync(GenerateAssignmentRequest request, CancellationToken ct = default);

    Task<GeneratedFeedbackDto> GenerateFeedbackAsync(GenerateFeedbackRequest request, CancellationToken ct = default);
}
