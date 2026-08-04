using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.TeacherAssignments;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class TeacherAssignmentServiceTests
{
    private readonly FakeTeacherAssignmentRepository _teacherAssignmentRepository = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeSubjectRepository _subjectRepository = new();
    private readonly FakeClassRepository _classRepository = new();

    private readonly Class _classA = new() { Name = "Class 10 - Section A" };
    private readonly Subject _math;
    private readonly User _teacher;
    private readonly User _student;

    public TeacherAssignmentServiceTests()
    {
        _math = new Subject { Name = "Mathematics", Code = "MATH101", ClassId = _classA.Id };
        _teacher = new User { FullName = "Rahim", Email = "teacher1@campusflow.edu", Role = UserRole.Teacher };
        _student = new User { FullName = "Karim", Email = "student1@campusflow.edu", Role = UserRole.Student, ClassId = _classA.Id };

        _classRepository.Seed(_classA);
        _subjectRepository.Seed(_math);
        _userRepository.Seed(_teacher, _student);
    }

    private TeacherAssignmentService CreateSut() => new(
        _teacherAssignmentRepository, _userRepository, _subjectRepository, _classRepository, NullLogger<TeacherAssignmentService>.Instance);

    [Fact]
    public async Task CreateAsync_WhenUserIsNotATeacher_ThrowsValidation()
    {
        var sut = CreateSut();

        var act = () => sut.CreateAsync(new CreateTeacherAssignmentRequest(_student.Id, _math.Id, _classA.Id));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task CreateAsync_WhenTeacherIdDoesNotExist_ThrowsValidation()
    {
        var sut = CreateSut();

        var act = () => sut.CreateAsync(new CreateTeacherAssignmentRequest("does-not-exist", _math.Id, _classA.Id));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task CreateAsync_WhenSubjectDoesNotBelongToClass_ThrowsValidation()
    {
        var otherClass = new Class { Name = "Class 10 - Section B" };
        _classRepository.Seed(otherClass);
        var sut = CreateSut();

        var act = () => sut.CreateAsync(new CreateTeacherAssignmentRequest(_teacher.Id, _math.Id, otherClass.Id));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task CreateAsync_WhenAlreadyAssigned_ThrowsConflict()
    {
        _teacherAssignmentRepository.Seed(new TeacherAssignment { TeacherId = _teacher.Id, SubjectId = _math.Id, ClassId = _classA.Id });
        var sut = CreateSut();

        var act = () => sut.CreateAsync(new CreateTeacherAssignmentRequest(_teacher.Id, _math.Id, _classA.Id));

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task CreateAsync_WithValidData_CreatesAssignmentWithNamesPopulated()
    {
        var sut = CreateSut();

        var result = await sut.CreateAsync(new CreateTeacherAssignmentRequest(_teacher.Id, _math.Id, _classA.Id));

        result.TeacherName.Should().Be(_teacher.FullName);
        result.SubjectName.Should().Be(_math.Name);
        result.ClassName.Should().Be(_classA.Name);
    }

    [Fact]
    public async Task DeleteAsync_WhenNotFound_ThrowsNotFound()
    {
        var sut = CreateSut();

        var act = () => sut.DeleteAsync("does-not-exist");

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_RemovesTheAssignment()
    {
        var entity = new TeacherAssignment { TeacherId = _teacher.Id, SubjectId = _math.Id, ClassId = _classA.Id };
        _teacherAssignmentRepository.Seed(entity);
        var sut = CreateSut();

        await sut.DeleteAsync(entity.Id);

        (await _teacherAssignmentRepository.GetByIdAsync(entity.Id)).Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_FilteredByTeacherId_OnlyReturnsThatTeachersAssignments()
    {
        var otherTeacher = new User { FullName = "Fatema", Email = "teacher2@campusflow.edu", Role = UserRole.Teacher };
        _userRepository.Seed(otherTeacher);
        _teacherAssignmentRepository.Seed(
            new TeacherAssignment { TeacherId = _teacher.Id, SubjectId = _math.Id, ClassId = _classA.Id },
            new TeacherAssignment { TeacherId = otherTeacher.Id, SubjectId = _math.Id, ClassId = _classA.Id });
        var sut = CreateSut();

        var result = await sut.GetAllAsync(_teacher.Id);

        result.Should().ContainSingle().Which.TeacherId.Should().Be(_teacher.Id);
    }
}
