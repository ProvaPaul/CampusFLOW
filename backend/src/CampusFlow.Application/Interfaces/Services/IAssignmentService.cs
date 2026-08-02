using CampusFlow.Application.DTOs.Assignments;
using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.Interfaces.Services;

public interface IAssignmentService
{
    /// <summary>Returns assignments visible to the current caller, filtered by their role.</summary>
    Task<List<AssignmentDto>> GetAllAsync(CancellationToken ct = default);

    Task<AssignmentDto> GetByIdAsync(string id, CancellationToken ct = default);

    Task<AssignmentDto> CreateAsync(CreateAssignmentRequest request, CancellationToken ct = default);

    Task<AssignmentDto> UpdateAsync(string id, UpdateAssignmentRequest request, CancellationToken ct = default);

    Task<AssignmentDto> UpdateStatusAsync(string id, AssignmentStatus status, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
