using CampusFlow.Application.DTOs.Announcements;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class AnnouncementServiceTests
{
    private readonly FakeAnnouncementRepository _announcementRepository = new();
    private readonly FakeUserRepository _userRepository = new();
    private readonly User _admin = new() { FullName = "Admin User", Role = UserRole.Admin };

    public AnnouncementServiceTests()
    {
        _userRepository.Seed(_admin);
    }

    private AnnouncementService CreateSut(string userId, UserRole role) =>
        new(_announcementRepository, _userRepository, new FakeCurrentUserService(userId, role), NullLogger<AnnouncementService>.Instance);

    [Fact]
    public async Task CreateAsync_SetsCreatedByToCurrentUser()
    {
        var sut = CreateSut(_admin.Id, UserRole.Admin);

        var result = await sut.CreateAsync(new CreateAnnouncementRequest("Welcome", "Hello everyone", null));

        result.CreatedByUserId.Should().Be(_admin.Id);
        result.CreatedByName.Should().Be(_admin.FullName);
    }

    [Fact]
    public async Task GetAllAsync_ForTeacher_ExcludesAnnouncementsTargetedAtStudentsOnly()
    {
        _announcementRepository.Seed(
            new Announcement { Title = "All", Message = "m", TargetRole = null, CreatedByUserId = _admin.Id },
            new Announcement { Title = "Teachers only", Message = "m", TargetRole = UserRole.Teacher, CreatedByUserId = _admin.Id },
            new Announcement { Title = "Students only", Message = "m", TargetRole = UserRole.Student, CreatedByUserId = _admin.Id });

        var sut = CreateSut("teacher-1", UserRole.Teacher);

        var result = await sut.GetAllAsync();

        result.Select(a => a.Title).Should().BeEquivalentTo(new[] { "All", "Teachers only" });
    }

    [Fact]
    public async Task GetAllAsync_ForAdmin_ReturnsEverything()
    {
        _announcementRepository.Seed(
            new Announcement { Title = "All", Message = "m", TargetRole = null, CreatedByUserId = _admin.Id },
            new Announcement { Title = "Students only", Message = "m", TargetRole = UserRole.Student, CreatedByUserId = _admin.Id });

        var sut = CreateSut(_admin.Id, UserRole.Admin);

        var result = await sut.GetAllAsync();

        result.Should().HaveCount(2);
    }
}
