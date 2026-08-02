using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Auth;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class AuthServiceTests
{
    private readonly FakeUserRepository _userRepository = new();
    private readonly FakeClassRepository _classRepository = new();
    private readonly FakePasswordHasher _passwordHasher = new();
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        _sut = new AuthService(_userRepository, _classRepository, _passwordHasher, new FakeJwtTokenGenerator(), NullLogger<AuthService>.Instance);
    }

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ReturnsTokenAndUser()
    {
        var user = new User
        {
            FullName = "Karim Hossain",
            Email = "student1@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Student@123"),
            Role = UserRole.Student,
            IsActive = true
        };
        _userRepository.Seed(user);

        var result = await _sut.LoginAsync(new LoginRequest(user.Email, "Student@123"));

        result.Token.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be(user.Email);
        result.User.Role.Should().Be(UserRole.Student);
    }

    [Fact]
    public async Task LoginAsync_WithWrongPassword_ThrowsValidationAppException()
    {
        var user = new User
        {
            Email = "teacher1@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Teacher@123"),
            Role = UserRole.Teacher,
            IsActive = true
        };
        _userRepository.Seed(user);

        var act = () => _sut.LoginAsync(new LoginRequest(user.Email, "WrongPassword"));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task LoginAsync_WithUnknownEmail_ThrowsValidationAppException()
    {
        var act = () => _sut.LoginAsync(new LoginRequest("nobody@campusflow.edu", "whatever"));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task LoginAsync_WithDeactivatedAccount_ThrowsValidationAppException()
    {
        var user = new User
        {
            Email = "inactive@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Pass@123"),
            Role = UserRole.Student,
            IsActive = false
        };
        _userRepository.Seed(user);

        var act = () => _sut.LoginAsync(new LoginRequest(user.Email, "Pass@123"));

        await act.Should().ThrowAsync<ValidationAppException>();
    }
}
