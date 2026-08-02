using CampusFlow.Application.DTOs.Classes;

namespace CampusFlow.Application.Interfaces.Services;

public interface IClassService
{
    Task<List<ClassDto>> GetAllAsync(CancellationToken ct = default);

    Task<ClassDto> GetByIdAsync(string id, CancellationToken ct = default);

    Task<ClassDto> CreateAsync(CreateClassRequest request, CancellationToken ct = default);

    Task<ClassDto> UpdateAsync(string id, UpdateClassRequest request, CancellationToken ct = default);

    Task DeleteAsync(string id, CancellationToken ct = default);
}
