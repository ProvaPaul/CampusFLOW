using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Submissions;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class SubmissionService : ISubmissionService
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<SubmissionService> _logger;

    public SubmissionService(
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUser,
        ILogger<SubmissionService> logger)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _userRepository = userRepository;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task<SubmissionDto> SubmitAsync(string assignmentId, CreateSubmissionRequest request, CancellationToken ct = default)
    {
        var assignment = await GetAssignmentOrThrowAsync(assignmentId, ct);
        var student = await _userRepository.GetByIdAsync(_currentUser.UserId, ct)
            ?? throw new NotFoundException(nameof(User), _currentUser.UserId);

        if (assignment.Status != AssignmentStatus.Published || assignment.ClassId != student.ClassId)
        {
            throw new ForbiddenException("This assignment is not available to you.");
        }

        if (await _submissionRepository.ExistsAsync(s => s.AssignmentId == assignmentId && s.StudentId == student.Id, ct))
        {
            throw new ConflictException("You have already submitted this assignment. Update your existing submission instead.");
        }

        var now = DateTime.UtcNow;
        var submission = new Submission
        {
            AssignmentId = assignmentId,
            StudentId = student.Id,
            AnswerText = request.AnswerText,
            AttachmentUrl = request.AttachmentUrl,
            SubmittedAt = now,
            Status = now > assignment.Deadline ? SubmissionStatus.Late : SubmissionStatus.Submitted
        };

        await _submissionRepository.CreateAsync(submission, ct);
        _logger.LogInformation("Student {StudentId} submitted assignment {AssignmentId} (status {Status})", student.Id, assignmentId, submission.Status);

        return await ToDtoAsync(submission, assignment, ct);
    }

    public async Task<SubmissionDto> UpdateAsync(string submissionId, UpdateSubmissionRequest request, CancellationToken ct = default)
    {
        var submission = await GetSubmissionOrThrowAsync(submissionId, ct);
        if (submission.StudentId != _currentUser.UserId)
        {
            throw new ForbiddenException("You do not own this submission.");
        }

        var assignment = await GetAssignmentOrThrowAsync(submission.AssignmentId, ct);

        if (submission.Status == SubmissionStatus.Graded)
        {
            throw new ValidationAppException("This submission has already been graded and can no longer be edited.");
        }

        if (!assignment.AllowResubmission)
        {
            throw new ValidationAppException("The teacher has disabled resubmission for this assignment.");
        }

        if (DateTime.UtcNow > assignment.Deadline)
        {
            throw new ValidationAppException("The deadline for this assignment has passed.");
        }

        submission.AnswerText = request.AnswerText;
        submission.AttachmentUrl = request.AttachmentUrl;
        submission.UpdatedAt = DateTime.UtcNow;

        await _submissionRepository.UpdateAsync(submission, ct);
        _logger.LogInformation("Student {StudentId} updated submission {SubmissionId}", submission.StudentId, submissionId);

        return await ToDtoAsync(submission, assignment, ct);
    }

    public async Task<SubmissionDto> GetByIdAsync(string submissionId, CancellationToken ct = default)
    {
        var submission = await GetSubmissionOrThrowAsync(submissionId, ct);
        var assignment = await GetAssignmentOrThrowAsync(submission.AssignmentId, ct);
        EnsureCanView(submission, assignment);

        return await ToDtoAsync(submission, assignment, ct);
    }

    public async Task<List<SubmissionDto>> GetByAssignmentAsync(string assignmentId, CancellationToken ct = default)
    {
        var assignment = await GetAssignmentOrThrowAsync(assignmentId, ct);

        if (_currentUser.Role != UserRole.Admin && assignment.TeacherId != _currentUser.UserId)
        {
            throw new ForbiddenException("You do not own this assignment.");
        }

        var submissions = await _submissionRepository.FindAsync(s => s.AssignmentId == assignmentId, ct);
        var dtos = new List<SubmissionDto>();
        foreach (var submission in submissions.OrderByDescending(s => s.SubmittedAt))
        {
            dtos.Add(await ToDtoAsync(submission, assignment, ct));
        }

        return dtos;
    }

    public async Task<List<SubmissionDto>> GetMyAsync(CancellationToken ct = default)
    {
        var submissions = await _submissionRepository.FindAsync(s => s.StudentId == _currentUser.UserId, ct);
        var assignments = await _assignmentRepository.GetAllAsync(ct);
        var assignmentById = assignments.ToDictionary(a => a.Id);

        var dtos = new List<SubmissionDto>();
        foreach (var submission in submissions.OrderByDescending(s => s.SubmittedAt))
        {
            if (assignmentById.TryGetValue(submission.AssignmentId, out var assignment))
            {
                dtos.Add(await ToDtoAsync(submission, assignment, ct));
            }
        }

        return dtos;
    }

    public async Task<SubmissionDto> GradeAsync(string submissionId, GradeSubmissionRequest request, CancellationToken ct = default)
    {
        var submission = await GetSubmissionOrThrowAsync(submissionId, ct);
        var assignment = await GetAssignmentOrThrowAsync(submission.AssignmentId, ct);

        if (assignment.TeacherId != _currentUser.UserId)
        {
            throw new ForbiddenException("You do not own this assignment.");
        }

        if (request.Marks > assignment.MaxMarks)
        {
            throw new ValidationAppException($"Marks cannot exceed the assignment's maximum of {assignment.MaxMarks}.");
        }

        submission.Marks = request.Marks;
        submission.Feedback = request.Feedback;
        submission.Status = SubmissionStatus.Graded;
        submission.GradedAt = DateTime.UtcNow;
        submission.UpdatedAt = DateTime.UtcNow;

        await _submissionRepository.UpdateAsync(submission, ct);
        _logger.LogInformation("Teacher {TeacherId} graded submission {SubmissionId} with {Marks}/{MaxMarks}",
            _currentUser.UserId, submissionId, request.Marks, assignment.MaxMarks);

        return await ToDtoAsync(submission, assignment, ct);
    }

    public async Task<SubmissionDto> UpdateStatusAsync(string submissionId, SubmissionStatus status, CancellationToken ct = default)
    {
        var submission = await GetSubmissionOrThrowAsync(submissionId, ct);
        var assignment = await GetAssignmentOrThrowAsync(submission.AssignmentId, ct);

        if (assignment.TeacherId != _currentUser.UserId)
        {
            throw new ForbiddenException("You do not own this assignment.");
        }

        submission.Status = status;
        submission.UpdatedAt = DateTime.UtcNow;
        await _submissionRepository.UpdateAsync(submission, ct);
        _logger.LogInformation("Teacher {TeacherId} set submission {SubmissionId} status to {Status}", _currentUser.UserId, submissionId, status);

        return await ToDtoAsync(submission, assignment, ct);
    }

    private void EnsureCanView(Submission submission, Assignment assignment)
    {
        var isOwner = submission.StudentId == _currentUser.UserId;
        var isTeacherOwner = assignment.TeacherId == _currentUser.UserId;
        var isAdmin = _currentUser.Role == UserRole.Admin;

        if (!isOwner && !isTeacherOwner && !isAdmin)
        {
            throw new ForbiddenException("You are not allowed to view this submission.");
        }
    }

    private async Task<Assignment> GetAssignmentOrThrowAsync(string assignmentId, CancellationToken ct) =>
        await _assignmentRepository.GetByIdAsync(assignmentId, ct) ?? throw new NotFoundException(nameof(Assignment), assignmentId);

    private async Task<Submission> GetSubmissionOrThrowAsync(string submissionId, CancellationToken ct) =>
        await _submissionRepository.GetByIdAsync(submissionId, ct) ?? throw new NotFoundException(nameof(Submission), submissionId);

    private async Task<SubmissionDto> ToDtoAsync(Submission submission, Assignment assignment, CancellationToken ct)
    {
        var student = await _userRepository.GetByIdAsync(submission.StudentId, ct);

        return new SubmissionDto(
            submission.Id,
            submission.AssignmentId,
            assignment.Title,
            submission.StudentId,
            student?.FullName ?? "Unknown",
            submission.AnswerText,
            submission.AttachmentUrl,
            submission.SubmittedAt,
            submission.Status,
            submission.Marks,
            assignment.MaxMarks,
            submission.Feedback,
            submission.GradedAt);
    }
}
