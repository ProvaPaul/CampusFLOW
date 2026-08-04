using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Classes;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class ClassServiceTests
{
    private readonly FakeClassRepository _classRepository = new();

    private ClassService CreateSut() => new(_classRepository, NullLogger<ClassService>.Instance);

    [Fact]
    public async Task CreateAsync_WithValidName_CreatesClass()
    {
        var sut = CreateSut();

        var result = await sut.CreateAsync(new CreateClassRequest("Class 9 - Section B", "New section"));

        result.Name.Should().Be("Class 9 - Section B");
        (await _classRepository.GetByIdAsync(result.Id)).Should().NotBeNull();
    }

    [Fact]
    public async Task CreateAsync_WhenNameAlreadyExists_ThrowsConflict()
    {
        _classRepository.Seed(new Class { Name = "Class 10 - Section A" });
        var sut = CreateSut();

        var act = () => sut.CreateAsync(new CreateClassRequest("Class 10 - Section A", null));

        await act.Should().ThrowAsync<ConflictException>();
    }

    [Fact]
    public async Task UpdateAsync_WhenClassDoesNotExist_ThrowsNotFound()
    {
        var sut = CreateSut();

        var act = () => sut.UpdateAsync("does-not-exist", new UpdateClassRequest("New name", null));

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_UpdatesNameAndDescription()
    {
        var existing = new Class { Name = "Old name", Description = "Old description" };
        _classRepository.Seed(existing);
        var sut = CreateSut();

        var result = await sut.UpdateAsync(existing.Id, new UpdateClassRequest("New name", "New description"));

        result.Name.Should().Be("New name");
        result.Description.Should().Be("New description");
    }

    [Fact]
    public async Task DeleteAsync_WhenClassDoesNotExist_ThrowsNotFound()
    {
        var sut = CreateSut();

        var act = () => sut.DeleteAsync("does-not-exist");

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_RemovesTheClass()
    {
        var existing = new Class { Name = "Class 10 - Section A" };
        _classRepository.Seed(existing);
        var sut = CreateSut();

        await sut.DeleteAsync(existing.Id);

        (await _classRepository.GetByIdAsync(existing.Id)).Should().BeNull();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsClassesOrderedByName()
    {
        _classRepository.Seed(
            new Class { Name = "Zed Class" },
            new Class { Name = "Alpha Class" });
        var sut = CreateSut();

        var result = await sut.GetAllAsync();

        result.Select(c => c.Name).Should().ContainInOrder("Alpha Class", "Zed Class");
    }
}
