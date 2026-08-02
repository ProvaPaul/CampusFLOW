using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Classes;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class ClassService : IClassService
{
    private readonly IClassRepository _classRepository;
    private readonly ILogger<ClassService> _logger;

    public ClassService(IClassRepository classRepository, ILogger<ClassService> logger)
    {
        _classRepository = classRepository;
        _logger = logger;
    }

    public async Task<List<ClassDto>> GetAllAsync(CancellationToken ct = default)
    {
        var classes = await _classRepository.GetAllAsync(ct);
        return classes.OrderBy(c => c.Name).Select(ToDto).ToList();
    }

    public async Task<ClassDto> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var entity = await GetOrThrowAsync(id, ct);
        return ToDto(entity);
    }

    public async Task<ClassDto> CreateAsync(CreateClassRequest request, CancellationToken ct = default)
    {
        if (await _classRepository.ExistsAsync(c => c.Name == request.Name, ct))
        {
            throw new ConflictException($"A class named '{request.Name}' already exists.");
        }

        var entity = new Class { Name = request.Name.Trim(), Description = request.Description };
        await _classRepository.CreateAsync(entity, ct);
        _logger.LogInformation("Created class {ClassName}", entity.Name);

        return ToDto(entity);
    }

    public async Task<ClassDto> UpdateAsync(string id, UpdateClassRequest request, CancellationToken ct = default)
    {
        var entity = await GetOrThrowAsync(id, ct);
        entity.Name = request.Name.Trim();
        entity.Description = request.Description;
        entity.UpdatedAt = DateTime.UtcNow;

        await _classRepository.UpdateAsync(entity, ct);
        _logger.LogInformation("Updated class {ClassId}", id);

        return ToDto(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        await GetOrThrowAsync(id, ct);
        await _classRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Deleted class {ClassId}", id);
    }

    private async Task<Class> GetOrThrowAsync(string id, CancellationToken ct) =>
        await _classRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Class), id);

    private static ClassDto ToDto(Class entity) => new(entity.Id, entity.Name, entity.Description, entity.CreatedAt);
}
