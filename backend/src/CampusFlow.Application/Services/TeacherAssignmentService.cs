using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.TeacherAssignments;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class TeacherAssignmentService : ITeacherAssignmentService
{
    private readonly ITeacherAssignmentRepository _teacherAssignmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IClassRepository _classRepository;
    private readonly ILogger<TeacherAssignmentService> _logger;

    public TeacherAssignmentService(
        ITeacherAssignmentRepository teacherAssignmentRepository,
        IUserRepository userRepository,
        ISubjectRepository subjectRepository,
        IClassRepository classRepository,
        ILogger<TeacherAssignmentService> logger)
    {
        _teacherAssignmentRepository = teacherAssignmentRepository;
        _userRepository = userRepository;
        _subjectRepository = subjectRepository;
        _classRepository = classRepository;
        _logger = logger;
    }

    public async Task<List<TeacherAssignmentDto>> GetAllAsync(string? teacherId, CancellationToken ct = default)
    {
        var assignments = string.IsNullOrEmpty(teacherId)
            ? await _teacherAssignmentRepository.GetAllAsync(ct)
            : await _teacherAssignmentRepository.FindAsync(a => a.TeacherId == teacherId, ct);

        var teachers = (await _userRepository.GetAllAsync(ct)).ToDictionary(u => u.Id, u => u.FullName);
        var subjects = (await _subjectRepository.GetAllAsync(ct)).ToDictionary(s => s.Id, s => s.Name);
        var classes = (await _classRepository.GetAllAsync(ct)).ToDictionary(c => c.Id, c => c.Name);

        return assignments.Select(a => new TeacherAssignmentDto(
            a.Id,
            a.TeacherId,
            teachers.GetValueOrDefault(a.TeacherId, "Unknown"),
            a.SubjectId,
            subjects.GetValueOrDefault(a.SubjectId, "Unknown"),
            a.ClassId,
            classes.GetValueOrDefault(a.ClassId, "Unknown"))).ToList();
    }

    public async Task<TeacherAssignmentDto> CreateAsync(CreateTeacherAssignmentRequest request, CancellationToken ct = default)
    {
        var teacher = await _userRepository.GetByIdAsync(request.TeacherId, ct);
        if (teacher is null || teacher.Role != UserRole.Teacher)
        {
            throw new ValidationAppException("The specified user is not a valid teacher.");
        }

        var subject = await _subjectRepository.GetByIdAsync(request.SubjectId, ct)
            ?? throw new NotFoundException(nameof(Subject), request.SubjectId);

        if (subject.ClassId != request.ClassId)
        {
            throw new ValidationAppException("The subject does not belong to the specified class.");
        }

        if (await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        if (await _teacherAssignmentRepository.ExistsAsync(
            a => a.TeacherId == request.TeacherId && a.SubjectId == request.SubjectId && a.ClassId == request.ClassId, ct))
        {
            throw new ConflictException("This teacher is already assigned to this subject/class.");
        }

        var entity = new TeacherAssignment
        {
            TeacherId = request.TeacherId,
            SubjectId = request.SubjectId,
            ClassId = request.ClassId
        };

        await _teacherAssignmentRepository.CreateAsync(entity, ct);
        _logger.LogInformation("Assigned teacher {TeacherId} to subject {SubjectId} in class {ClassId}", request.TeacherId, request.SubjectId, request.ClassId);

        return new TeacherAssignmentDto(entity.Id, teacher.Id, teacher.FullName, subject.Id, subject.Name, request.ClassId,
            (await _classRepository.GetByIdAsync(request.ClassId, ct))!.Name);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        var entity = await _teacherAssignmentRepository.GetByIdAsync(id, ct)
            ?? throw new NotFoundException(nameof(TeacherAssignment), id);

        await _teacherAssignmentRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Removed teacher assignment {AssignmentId}", id);
    }
}
