using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Subjects;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class SubjectServiceTests
{
    private readonly FakeSubjectRepository _subjectRepository = new();
    private readonly FakeClassRepository _classRepository = new();

    private readonly Class _classA = new() { Name = "Class 10 - Section A" };
    private readonly Class _classB = new() { Name = "Class 10 - Section B" };

    public SubjectServiceTests()
    {
        _classRepository.Seed(_classA, _classB);
    }

    private SubjectService CreateSut() => new(_subjectRepository, _classRepository, NullLogger<SubjectService>.Instance);

    [Fact]
    public async Task CreateAsync_WhenClassDoesNotExist_ThrowsNotFound()
    {
        var sut = CreateSut();

        var act = () => sut.CreateAsync(new CreateSubjectRequest("Mathematics", "MATH101", "does-not-exist"));

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task CreateAsync_WithValidClass_CreatesSubjectWithClassNamePopulated()
    {
        var sut = CreateSut();

        var result = await sut.CreateAsync(new CreateSubjectRequest("Mathematics", "MATH101", _classA.Id));

        result.Name.Should().Be("Mathematics");
        result.ClassId.Should().Be(_classA.Id);
        result.ClassName.Should().Be(_classA.Name);
    }

    [Fact]
    public async Task UpdateAsync_WhenSubjectDoesNotExist_ThrowsNotFound()
    {
        var sut = CreateSut();

        var act = () => sut.UpdateAsync("does-not-exist", new UpdateSubjectRequest("New name", "NEW101"));

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_UpdatesNameAndCode()
    {
        var subject = new Subject { Name = "Old name", Code = "OLD101", ClassId = _classA.Id };
        _subjectRepository.Seed(subject);
        var sut = CreateSut();

        var result = await sut.UpdateAsync(subject.Id, new UpdateSubjectRequest("New name", "NEW101"));

        result.Name.Should().Be("New name");
        result.Code.Should().Be("NEW101");
    }

    [Fact]
    public async Task DeleteAsync_WhenSubjectDoesNotExist_ThrowsNotFound()
    {
        var sut = CreateSut();

        var act = () => sut.DeleteAsync("does-not-exist");

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_RemovesTheSubject()
    {
        var subject = new Subject { Name = "Mathematics", Code = "MATH101", ClassId = _classA.Id };
        _subjectRepository.Seed(subject);
        var sut = CreateSut();

        await sut.DeleteAsync(subject.Id);

        (await _subjectRepository.GetByIdAsync(subject.Id)).Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_FilteredByClassId_OnlyReturnsSubjectsForThatClass()
    {
        _subjectRepository.Seed(
            new Subject { Name = "Mathematics", Code = "MATH101", ClassId = _classA.Id },
            new Subject { Name = "English", Code = "ENG101", ClassId = _classB.Id });
        var sut = CreateSut();

        var result = await sut.GetAllAsync(_classA.Id);

        result.Should().ContainSingle().Which.Name.Should().Be("Mathematics");
    }

    [Fact]
    public async Task GetAllAsync_WithoutClassIdFilter_ReturnsAllSubjects()
    {
        _subjectRepository.Seed(
            new Subject { Name = "Mathematics", Code = "MATH101", ClassId = _classA.Id },
            new Subject { Name = "English", Code = "ENG101", ClassId = _classB.Id });
        var sut = CreateSut();

        var result = await sut.GetAllAsync(null);

        result.Should().HaveCount(2);
    }
}
