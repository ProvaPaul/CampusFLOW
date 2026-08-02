using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Subjects;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class SubjectService : ISubjectService
{
    private readonly ISubjectRepository _subjectRepository;
    private readonly IClassRepository _classRepository;
    private readonly ILogger<SubjectService> _logger;

    public SubjectService(ISubjectRepository subjectRepository, IClassRepository classRepository, ILogger<SubjectService> logger)
    {
        _subjectRepository = subjectRepository;
        _classRepository = classRepository;
        _logger = logger;
    }

    public async Task<List<SubjectDto>> GetAllAsync(string? classId, CancellationToken ct = default)
    {
        var subjects = string.IsNullOrEmpty(classId)
            ? await _subjectRepository.GetAllAsync(ct)
            : await _subjectRepository.FindAsync(s => s.ClassId == classId, ct);

        var classes = await _classRepository.GetAllAsync(ct);
        var classNameById = classes.ToDictionary(c => c.Id, c => c.Name);

        return subjects
            .OrderBy(s => s.Name)
            .Select(s => ToDto(s, classNameById.GetValueOrDefault(s.ClassId)))
            .ToList();
    }

    public async Task<SubjectDto> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var subject = await GetOrThrowAsync(id, ct);
        var subjectClass = await _classRepository.GetByIdAsync(subject.ClassId, ct);
        return ToDto(subject, subjectClass?.Name);
    }

    public async Task<SubjectDto> CreateAsync(CreateSubjectRequest request, CancellationToken ct = default)
    {
        if (await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        var subject = new Subject { Name = request.Name.Trim(), Code = request.Code.Trim(), ClassId = request.ClassId };
        await _subjectRepository.CreateAsync(subject, ct);
        _logger.LogInformation("Created subject {SubjectName} for class {ClassId}", subject.Name, subject.ClassId);

        return await GetByIdAsync(subject.Id, ct);
    }

    public async Task<SubjectDto> UpdateAsync(string id, UpdateSubjectRequest request, CancellationToken ct = default)
    {
        var subject = await GetOrThrowAsync(id, ct);
        subject.Name = request.Name.Trim();
        subject.Code = request.Code.Trim();
        subject.UpdatedAt = DateTime.UtcNow;

        await _subjectRepository.UpdateAsync(subject, ct);
        _logger.LogInformation("Updated subject {SubjectId}", id);

        return await GetByIdAsync(id, ct);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        await GetOrThrowAsync(id, ct);
        await _subjectRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Deleted subject {SubjectId}", id);
    }

    private async Task<Subject> GetOrThrowAsync(string id, CancellationToken ct) =>
        await _subjectRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Subject), id);

    private static SubjectDto ToDto(Subject entity, string? className) =>
        new(entity.Id, entity.Name, entity.Code, entity.ClassId, className);
}
