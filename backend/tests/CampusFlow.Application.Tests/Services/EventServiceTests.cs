using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Events;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class EventServiceTests
{
    private readonly FakeEventRepository _eventRepository = new();
    private readonly FakeClassRepository _classRepository = new();
    private readonly FakeUserRepository _userRepository = new();

    private readonly Class _classA = new() { Name = "Class 10 - Section A" };
    private readonly Class _classB = new() { Name = "Class 10 - Section B" };
    private readonly User _admin = new() { FullName = "Admin User", Role = UserRole.Admin };

    public EventServiceTests()
    {
        _classRepository.Seed(_classA, _classB);
        _userRepository.Seed(_admin);
    }

    private EventService CreateSut(string userId, UserRole role) =>
        new(_eventRepository, _classRepository, _userRepository,
            new FakeCurrentUserService(userId, role), NullLogger<EventService>.Instance);

    [Fact]
    public async Task CreateAsync_WithSchoolWideEvent_Succeeds()
    {
        var sut = CreateSut(_admin.Id, UserRole.Admin);

        var result = await sut.CreateAsync(new CreateEventRequest(
            "Mid-terms", "Mid-term exams", EventType.Exam, DateTime.UtcNow.AddDays(5), null, null));

        result.Title.Should().Be("Mid-terms");
        result.ClassId.Should().BeNull();
        result.CreatedByName.Should().Be(_admin.FullName);
    }

    [Fact]
    public async Task CreateAsync_WithUnknownClassId_ThrowsNotFound()
    {
        var sut = CreateSut(_admin.Id, UserRole.Admin);

        var act = () => sut.CreateAsync(new CreateEventRequest(
            "Meeting", "PTM", EventType.Meeting, DateTime.UtcNow.AddDays(3), null, "does-not-exist"));

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetAllAsync_ForStudent_OnlyReturnsSchoolWideAndOwnClassEvents()
    {
        var student = new User { FullName = "Karim", Role = UserRole.Student, ClassId = _classA.Id };
        _userRepository.Seed(student);

        _eventRepository.Seed(
            new Event { Title = "School-wide", Type = EventType.Holiday, StartDate = DateTime.UtcNow, ClassId = null, CreatedByUserId = _admin.Id },
            new Event { Title = "Class A only", Type = EventType.Meeting, StartDate = DateTime.UtcNow, ClassId = _classA.Id, CreatedByUserId = _admin.Id },
            new Event { Title = "Class B only", Type = EventType.Meeting, StartDate = DateTime.UtcNow, ClassId = _classB.Id, CreatedByUserId = _admin.Id });

        var sut = CreateSut(student.Id, UserRole.Student);

        var result = await sut.GetAllAsync();

        result.Select(e => e.Title).Should().BeEquivalentTo(new[] { "School-wide", "Class A only" });
    }

    [Fact]
    public async Task GetAllAsync_ForAdmin_ReturnsEveryEvent()
    {
        _eventRepository.Seed(
            new Event { Title = "School-wide", Type = EventType.Holiday, StartDate = DateTime.UtcNow, CreatedByUserId = _admin.Id },
            new Event { Title = "Class A only", Type = EventType.Meeting, StartDate = DateTime.UtcNow, ClassId = _classA.Id, CreatedByUserId = _admin.Id });

        var sut = CreateSut(_admin.Id, UserRole.Admin);

        var result = await sut.GetAllAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task DeleteAsync_WhenEventDoesNotExist_ThrowsNotFound()
    {
        var sut = CreateSut(_admin.Id, UserRole.Admin);

        var act = () => sut.DeleteAsync("does-not-exist");

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
