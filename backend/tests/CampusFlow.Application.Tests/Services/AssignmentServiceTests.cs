using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Assignments;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class AssignmentServiceTests
{
    private readonly FakeAssignmentRepository _assignmentRepository = new();
    private readonly FakeSubmissionRepository _submissionRepository = new();
    private readonly FakeTeacherAssignmentRepository _teacherAssignmentRepository = new();
    private readonly FakeClassRepository _classRepository = new();
    private readonly FakeSubjectRepository _subjectRepository = new();
    private readonly FakeUserRepository _userRepository = new();

    private readonly Class _classA = new() { Name = "Class 10A" };
    private readonly Subject _math;
    private readonly User _teacher;
    private readonly User _otherTeacher;
    private readonly User _student;

    public AssignmentServiceTests()
    {
        _math = new Subject { Name = "Mathematics", Code = "MATH101", ClassId = _classA.Id };
        _teacher = new User { FullName = "Rahim", Email = "teacher1@campusflow.edu", Role = UserRole.Teacher };
        _otherTeacher = new User { FullName = "Fatema", Email = "teacher2@campusflow.edu", Role = UserRole.Teacher };
        _student = new User { FullName = "Karim", Email = "student1@campusflow.edu", Role = UserRole.Student, ClassId = _classA.Id };

        _classRepository.Seed(_classA);
        _subjectRepository.Seed(_math);
        _userRepository.Seed(_teacher, _otherTeacher, _student);
    }

    private AssignmentService CreateSut(FakeCurrentUserService currentUser) => new(
        _assignmentRepository,
        _submissionRepository,
        _teacherAssignmentRepository,
        _classRepository,
        _subjectRepository,
        _userRepository,
        currentUser,
        NullLogger<AssignmentService>.Instance);

    private static CreateAssignmentRequest ValidCreateRequest(Class classEntity, Subject subject, bool publish = true) => new(
        "Algebra Basics",
        "Solve the attached problems.",
        classEntity.Id,
        subject.Id,
        DateTime.UtcNow.AddDays(7),
        100,
        AllowResubmission: true,
        PublishImmediately: publish);

    [Fact]
    public async Task CreateAsync_WhenTeacherNotAssignedToSubject_ThrowsForbidden()
    {
        var sut = CreateSut(new FakeCurrentUserService(_teacher.Id, UserRole.Teacher));

        var act = () => sut.CreateAsync(ValidCreateRequest(_classA, _math));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task CreateAsync_WhenTeacherIsAssigned_CreatesAssignmentWithRequestedStatus()
    {
        _teacherAssignmentRepository.Seed(new TeacherAssignment { TeacherId = _teacher.Id, SubjectId = _math.Id, ClassId = _classA.Id });
        var sut = CreateSut(new FakeCurrentUserService(_teacher.Id, UserRole.Teacher));

        var draft = await sut.CreateAsync(ValidCreateRequest(_classA, _math, publish: false));
        var published = await sut.CreateAsync(ValidCreateRequest(_classA, _math, publish: true));

        draft.Status.Should().Be(AssignmentStatus.Draft);
        published.Status.Should().Be(AssignmentStatus.Published);
        draft.TeacherId.Should().Be(_teacher.Id);
    }

    [Fact]
    public async Task UpdateAsync_WhenCallerIsNotTheOwningTeacher_ThrowsForbidden()
    {
        var assignment = SeedAssignment(_teacher.Id, AssignmentStatus.Published);
        var sut = CreateSut(new FakeCurrentUserService(_otherTeacher.Id, UserRole.Teacher));

        var act = () => sut.UpdateAsync(assignment.Id, new UpdateAssignmentRequest("New title", "New description", DateTime.UtcNow.AddDays(3), 100, true));

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task GetAllAsync_ForStudent_OnlyReturnsPublishedAssignmentsInOwnClass()
    {
        var otherClass = new Class { Name = "Class 10B" };
        _classRepository.Seed(otherClass);

        var published = SeedAssignment(_teacher.Id, AssignmentStatus.Published);
        SeedAssignment(_teacher.Id, AssignmentStatus.Draft);
        SeedAssignment(_teacher.Id, AssignmentStatus.Published, classId: otherClass.Id);

        var sut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));

        var result = await sut.GetAllAsync();

        result.Should().ContainSingle().Which.Id.Should().Be(published.Id);
    }

    [Fact]
    public async Task GetByIdAsync_ForStudent_WhenAssignmentIsStillDraft_ThrowsForbidden()
    {
        var draft = SeedAssignment(_teacher.Id, AssignmentStatus.Draft);
        var sut = CreateSut(new FakeCurrentUserService(_student.Id, UserRole.Student));

        var act = () => sut.GetByIdAsync(draft.Id);

        await act.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task DeleteAsync_AsAdmin_CanDeleteAnyTeachersAssignment()
    {
        var assignment = SeedAssignment(_teacher.Id, AssignmentStatus.Published);
        var admin = new User { FullName = "Admin", Email = "admin@campusflow.edu", Role = UserRole.Admin };
        _userRepository.Seed(admin);

        var sut = CreateSut(new FakeCurrentUserService(admin.Id, UserRole.Admin));

        await sut.DeleteAsync(assignment.Id);

        (await _assignmentRepository.GetByIdAsync(assignment.Id)).Should().BeNull();
    }

    private Assignment SeedAssignment(string teacherId, AssignmentStatus status, string? classId = null)
    {
        var assignment = new Assignment
        {
            Title = "Algebra Basics",
            Description = "Solve the attached problems.",
            ClassId = classId ?? _classA.Id,
            SubjectId = _math.Id,
            TeacherId = teacherId,
            Deadline = DateTime.UtcNow.AddDays(7),
            MaxMarks = 100,
            Status = status,
            AllowResubmission = true
        };
        _assignmentRepository.Seed(assignment);
        return assignment;
    }
}
