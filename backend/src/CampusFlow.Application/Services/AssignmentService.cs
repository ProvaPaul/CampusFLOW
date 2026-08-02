using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Assignments;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class AssignmentService : IAssignmentService
{
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly ITeacherAssignmentRepository _teacherAssignmentRepository;
    private readonly IClassRepository _classRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<AssignmentService> _logger;

    public AssignmentService(
        IAssignmentRepository assignmentRepository,
        ISubmissionRepository submissionRepository,
        ITeacherAssignmentRepository teacherAssignmentRepository,
        IClassRepository classRepository,
        ISubjectRepository subjectRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        ILogger<AssignmentService> logger)
    {
        _assignmentRepository = assignmentRepository;
        _submissionRepository = submissionRepository;
        _teacherAssignmentRepository = teacherAssignmentRepository;
        _classRepository = classRepository;
        _subjectRepository = subjectRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<List<AssignmentDto>> GetAllAsync(CancellationToken ct = default)
    {
        List<Assignment> assignments;

        switch (_currentUser.Role)
        {
            case UserRole.Admin:
                assignments = await _assignmentRepository.GetAllAsync(ct);
                break;

            case UserRole.Teacher:
                assignments = await _assignmentRepository.FindAsync(a => a.TeacherId == _currentUser.UserId, ct);
                break;

            case UserRole.Student:
                var student = await _userRepository.GetByIdAsync(_currentUser.UserId, ct)
                    ?? throw new NotFoundException(nameof(User), _currentUser.UserId);

                assignments = string.IsNullOrEmpty(student.ClassId)
                    ? new List<Assignment>()
                    : await _assignmentRepository.FindAsync(
                        a => a.ClassId == student.ClassId && a.Status == AssignmentStatus.Published, ct);
                break;

            default:
                assignments = new List<Assignment>();
                break;
        }

        return await ToDtosAsync(assignments.OrderByDescending(a => a.CreatedAt).ToList(), ct);
    }

    public async Task<AssignmentDto> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var assignment = await GetOrThrowAsync(id, ct);
        await EnsureVisibleAsync(assignment, ct);
        return (await ToDtosAsync(new List<Assignment> { assignment }, ct)).Single();
    }

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentRequest request, CancellationToken ct = default)
    {
        if (await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        var subject = await _subjectRepository.GetByIdAsync(request.SubjectId, ct)
            ?? throw new NotFoundException(nameof(Subject), request.SubjectId);

        if (subject.ClassId != request.ClassId)
        {
            throw new ValidationAppException("The subject does not belong to the specified class.");
        }

        var isAssigned = await _teacherAssignmentRepository.ExistsAsync(
            a => a.TeacherId == _currentUser.UserId && a.SubjectId == request.SubjectId && a.ClassId == request.ClassId, ct);

        if (!isAssigned)
        {
            throw new ForbiddenException("You are not assigned to teach this subject for this class.");
        }

        var assignment = new Assignment
        {
            Title = request.Title.Trim(),
            Description = request.Description,
            ClassId = request.ClassId,
            SubjectId = request.SubjectId,
            TeacherId = _currentUser.UserId,
            Deadline = request.Deadline,
            MaxMarks = request.MaxMarks,
            AllowResubmission = request.AllowResubmission,
            Status = request.PublishImmediately ? AssignmentStatus.Published : AssignmentStatus.Draft
        };

        await _assignmentRepository.CreateAsync(assignment, ct);
        _logger.LogInformation("Teacher {TeacherId} created assignment {AssignmentId} ({Status})", _currentUser.UserId, assignment.Id, assignment.Status);

        return (await ToDtosAsync(new List<Assignment> { assignment }, ct)).Single();
    }

    public async Task<AssignmentDto> UpdateAsync(string id, UpdateAssignmentRequest request, CancellationToken ct = default)
    {
        var assignment = await GetOrThrowAsync(id, ct);
        EnsureOwner(assignment);

        assignment.Title = request.Title.Trim();
        assignment.Description = request.Description;
        assignment.Deadline = request.Deadline;
        assignment.MaxMarks = request.MaxMarks;
        assignment.AllowResubmission = request.AllowResubmission;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _assignmentRepository.UpdateAsync(assignment, ct);
        _logger.LogInformation("Teacher {TeacherId} updated assignment {AssignmentId}", _currentUser.UserId, id);

        return (await ToDtosAsync(new List<Assignment> { assignment }, ct)).Single();
    }

    public async Task<AssignmentDto> UpdateStatusAsync(string id, AssignmentStatus status, CancellationToken ct = default)
    {
        var assignment = await GetOrThrowAsync(id, ct);
        EnsureOwner(assignment);

        assignment.Status = status;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _assignmentRepository.UpdateAsync(assignment, ct);
        _logger.LogInformation("Teacher {TeacherId} set assignment {AssignmentId} status to {Status}", _currentUser.UserId, id, status);

        return (await ToDtosAsync(new List<Assignment> { assignment }, ct)).Single();
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        var assignment = await GetOrThrowAsync(id, ct);

        if (_currentUser.Role != UserRole.Admin)
        {
            EnsureOwner(assignment);
        }

        await _assignmentRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Deleted assignment {AssignmentId}", id);
    }

    private void EnsureOwner(Assignment assignment)
    {
        if (assignment.TeacherId != _currentUser.UserId)
        {
            throw new ForbiddenException("You do not own this assignment.");
        }
    }

    private async Task EnsureVisibleAsync(Assignment assignment, CancellationToken ct)
    {
        switch (_currentUser.Role)
        {
            case UserRole.Admin:
                return;
            case UserRole.Teacher:
                if (assignment.TeacherId != _currentUser.UserId)
                {
                    throw new ForbiddenException("You do not own this assignment.");
                }
                return;
            case UserRole.Student:
                var student = await _userRepository.GetByIdAsync(_currentUser.UserId, ct)
                    ?? throw new NotFoundException(nameof(User), _currentUser.UserId);

                if (assignment.ClassId != student.ClassId || assignment.Status != AssignmentStatus.Published)
                {
                    throw new ForbiddenException("This assignment is not available to you.");
                }
                return;
        }
    }

    private async Task<Assignment> GetOrThrowAsync(string id, CancellationToken ct) =>
        await _assignmentRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(Assignment), id);

    private async Task<List<AssignmentDto>> ToDtosAsync(List<Assignment> assignments, CancellationToken ct)
    {
        if (assignments.Count == 0)
        {
            return new List<AssignmentDto>();
        }

        var classes = (await _classRepository.GetAllAsync(ct)).ToDictionary(c => c.Id, c => c.Name);
        var subjects = (await _subjectRepository.GetAllAsync(ct)).ToDictionary(s => s.Id, s => s.Name);
        var teachers = (await _userRepository.GetAllAsync(ct)).ToDictionary(u => u.Id, u => u.FullName);

        var assignmentIds = assignments.Select(a => a.Id).ToList();
        var submissions = await _submissionRepository.FindAsync(s => assignmentIds.Contains(s.AssignmentId), ct);
        var submissionsByAssignment = submissions.GroupBy(s => s.AssignmentId).ToDictionary(g => g.Key, g => g.ToList());

        return assignments.Select(a =>
        {
            var assignmentSubmissions = submissionsByAssignment.GetValueOrDefault(a.Id, new List<Submission>());
            SubmissionSummaryDto? mySubmission = null;

            if (_currentUser.Role == UserRole.Student)
            {
                var mine = assignmentSubmissions.FirstOrDefault(s => s.StudentId == _currentUser.UserId);
                if (mine is not null)
                {
                    mySubmission = new SubmissionSummaryDto(mine.Id, mine.Status, mine.Marks, mine.SubmittedAt);
                }
            }

            return new AssignmentDto(
                a.Id,
                a.Title,
                a.Description,
                a.ClassId,
                classes.GetValueOrDefault(a.ClassId, "Unknown"),
                a.SubjectId,
                subjects.GetValueOrDefault(a.SubjectId, "Unknown"),
                a.TeacherId,
                teachers.GetValueOrDefault(a.TeacherId, "Unknown"),
                a.Deadline,
                a.MaxMarks,
                a.Status,
                a.AllowResubmission,
                a.CreatedAt,
                a.UpdatedAt,
                assignmentSubmissions.Count,
                mySubmission);
        }).ToList();
    }
}
