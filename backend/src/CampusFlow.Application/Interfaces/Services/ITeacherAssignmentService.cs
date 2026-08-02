using CampusFlow.Application.DTOs.TeacherAssignments;

namespace CampusFlow.Application.Interfaces.Services;

public interface ITeacherAssignmentService
{
    Task<List<TeacherAssignmentDto>> GetAllAsync(string? teacherId, CancellationToken ct = default);

    Task<TeacherAssignmentDto> CreateAsync(CreateTeacherAssignmentRequest request, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
