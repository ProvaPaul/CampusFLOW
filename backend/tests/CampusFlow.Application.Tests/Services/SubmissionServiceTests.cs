using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Submissions;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class SubmissionServiceTests
{
    private readonly FakeSubmissionRepository _submissionRepository = new();
    private readonly FakeAssignmentRepository _assignmentRepository = new();
    private readonly FakeUserRepository _userRepository = new();

    private readonly Class _classA = new() { Name = "Class 10A" };
    private readonly User _teacher;
    private readonly User _otherTeacher;
    private readonly User _student;
    private readonly User _otherStudent;

    public SubmissionServiceTests()
    {
        _teacher = new User { FullName = "Rahim", Email = "teacher1@campusflow.edu", Role = UserRole.Teacher };
        _otherTeacher = new User { FullName = "Fatema", Email = "teacher2@campusflow.edu", Role = UserRole.Teacher };
        _student = new User { FullName = "Karim", Email = "student1@campusflow.edu", Role = UserRole.Student, ClassId = _classA.Id };
        _otherStudent = new User { FullName = "Nusrat", Email = "student2@campusflow.edu", Role = UserRole.Student, ClassId = _classA.Id };

        _userRepository.Seed(_teacher, _otherTeacher, _student, _otherStudent);
    }

    private SubmissionService CreateSut(FakeCurrentUserService currentUser) =>
        new(_submissionRepository, _assignmentRepository, _userRepository, currentUser, NullLogger<SubmissionService>.Instance);

    private Assignment SeedAssignment(DateTime deadline, bool allowResubmission = true, AssignmentStatus status = AssignmentStatus.Published, int maxMarks = 100)
    {
        var assignment = new Assignment
        {
            Title = "Algebra Basics",
            Description = "Solve the problems.",
            ClassId = _classA.Id,
            SubjectId = "subject-1",
            TeacherId = _teacher.Id,
            Deadline = deadline,
            MaxMarks = maxMarks,
            Status = status,
            AllowResubmission = allowResubmission
        };
        _assignmentRepository.Seed(assignment);
        return assignment;
    }

    [Fact]
    public async Task SubmitAsync_BeforeDeadline_SetsStatusSubmitted()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var sut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));

        var result = await sut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("My answer", null));

        result.Status.Should().Be(SubmissionStatus.Submitted);
    }

    [Fact]
    public async Task SubmitAsync_AfterDeadline_SetsStatusLateButStillAccepts()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddMinutes(-10));
        var sut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));

        var result = await sut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Late answer", null));

        result.Status.Should().Be(SubmissionStatus.Late);
    }

    [Fact]
    public async Task SubmitAsync_WhenAlreadySubmitted_ThrowsConflict()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var sut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        await sut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("First answer", null));

        var act = () => sut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Second answer", null));

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task SubmitAsync_WhenAssignmentIsStillDraft_ThrowsForbidden()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3), status: AssignmentStatus.Draft);
        var sut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));

        var act = () => sut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateAsync_AfterDeadline_ThrowsValidationAppException()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var studentSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await studentSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        assignment.Deadline = DateTime.UtcNow.AddMinutes(-1);
        await _assignmentRepository.UpdateAsync(assignment);

        var act = () => studentSut.UpdateAsync(submission.Id, new UpdateSubmissionRequest("Updated answer", null));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task UpdateAsync_WhenResubmissionDisabled_ThrowsValidationAppException()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3), allowResubmission: false);
        var studentSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await studentSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        var act = () => studentSut.UpdateAsync(submission.Id, new UpdateSubmissionRequest("Updated answer", null));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task UpdateAsync_WhenNotTheOwningStudent_ThrowsForbidden()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var ownerSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await ownerSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        var otherSut = CreateSut(new FakeCurrentUserService(_otherStudent.Id, UserRole.Student));
        var act = () => otherSut.UpdateAsync(submission.Id, new UpdateSubmissionRequest("Hijacked answer", null));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateAsync_AfterGraded_ThrowsValidationAppException()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var studentSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await studentSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        var teacherSut = CreateSut(new FakeCurrentUserService(_teacher.Id, UserRole.Teacher));
        await teacherSut.GradeAsync(submission.Id, new GradeSubmissionRequest(90, "Great job"));

        var act = () => studentSut.UpdateAsync(submission.Id, new UpdateSubmissionRequest("Trying to edit after grading", null));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task GradeAsync_WhenMarksExceedMaxMarks_ThrowsValidationAppException()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3), maxMarks: 50);
        var studentSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await studentSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        var teacherSut = CreateSut(new FakeCurrentUserService(_teacher.Id, UserRole.Teacher));
        var act = () => teacherSut.GradeAsync(submission.Id, new GradeSubmissionRequest(75, "Too generous"));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task GradeAsync_WhenCallerDoesNotOwnAssignment_ThrowsForbidden()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var studentSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await studentSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        var otherTeacherSut = CreateSut(new FakeCurrentUserService(_otherTeacher.Id, UserRole.Teacher));
        var act = () => otherTeacherSut.GradeAsync(submission.Id, new GradeSubmissionRequest(80, "Nice"));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GradeAsync_WithValidMarks_SetsGradedStatusAndFeedback()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3), maxMarks: 100);
        var studentSut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));
        var submission = await studentSut.SubmitAsync(assignment.Id, new CreateSubmissionRequest("Answer", null));

        var teacherSut = CreateSut(new FakeCurrentUserService(_teacher.Id, UserRole.Teacher));
        var result = await teacherSut.GradeAsync(submission.Id, new GradeSubmissionRequest(88, "Solid work"));

        result.Status.Should().Be(SubmissionStatus.Graded);
        result.Marks.Should().Be(88);
        result.Feedback.Should().Be("Solid work");
    }

    [Fact]
    public async Task GetByAssignmentAsync_WhenCallerDoesNotOwnAssignment_ThrowsForbidden()
    {
        var assignment = SeedAssignment(DateTime.UtcNow.AddDays(3));
        var otherTeacherSut = CreateSut(new FakeCurrentUserService(_otherTeacher.Id, UserRole.Teacher));

        var act = () => otherTeacherSut.GetByAssignmentAsync(assignment.Id);

        await act.Should().ThrowAsync<ForbiddenException>();
    }
}
