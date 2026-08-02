using CampusFlow.Application.DTOs.Subjects;

namespace CampusFlow.Application.Interfaces.Services;

public interface ISubjectService
{
    Task<List<SubjectDto>> GetAllAsync(string? classId, CancellationToken ct = default);

    Task<SubjectDto> GetByIdAsync(string id, CancellationToken ct = default);

    Task<SubjectDto> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default);

    Task<SubjectDto> UpdateAsync(string id, UpdateSubjectRequest request, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
