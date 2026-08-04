using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Users;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using CampusFlow.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IClassRepository _classRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IClassRepository classRepository,
        IPasswordHasher passwordHasher,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _classRepository = classRepository;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<List<UserDto>> GetAllAsync(CancellationToken ct = default)
    {
        var users = await _userRepository.GetAllAsync(ct);
        var classes = await _classRepository.GetAllAsync(ct);
        var classNameById = classes.ToDictionary(c => c.Id, c => c.Name);

        return users
            .OrderBy(u => u.Role).ThenBy(u => u.FullName)
            .Select(u => ToDto(u, classNameById.GetValueOrDefault(u.ClassId ?? string.Empty)))
            .ToList();
    }

    public async Task<UserDto> GetByIdAsync(string id, CancellationToken ct = default)
    {
        var user = await GetUserOrThrowAsync(id, ct);
        string? className = null;
        if (!string.IsNullOrEmpty(user.ClassId))
        {
            var studentClass = await _classRepository.GetByIdAsync(user.ClassId, ct);
            className = studentClass?.Name;
        }

        return ToDto(user, className);
    }

    public async Task<UserDto> CreateAsync(CreateUserRequest request, CancellationToken ct = default)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _userRepository.ExistsAsync(u => u.Email == email, ct))
        {
            throw new ConflictException($"A user with email '{email}' already exists.");
        }

        if (!string.IsNullOrEmpty(request.ClassId) && await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = request.Role,
            ClassId = request.Role == Domain.Enums.UserRole.Student ? request.ClassId : null,
            IsActive = true
        };

        await _userRepository.CreateAsync(user, ct);
        _logger.LogInformation("Created user {Email} with role {Role}", user.Email, user.Role);

        return await GetByIdAsync(user.Id, ct);
    }

    public async Task<UserDto> UpdateAsync(string id, UpdateUserRequest request, CancellationToken ct = default)
    {
        var user = await GetUserOrThrowAsync(id, ct);

        if (!string.IsNullOrEmpty(request.ClassId) && await _classRepository.GetByIdAsync(request.ClassId, ct) is null)
        {
            throw new NotFoundException(nameof(Class), request.ClassId);
        }

        user.FullName = request.FullName.Trim();
        user.IsActive = request.IsActive;
        if (user.Role == Domain.Enums.UserRole.Student)
        {
            user.ClassId = request.ClassId;
        }

        await _userRepository.UpdateAsync(user, ct);
        _logger.LogInformation("Updated user {UserId}", id);

        return await GetByIdAsync(id, ct);
    }

    public async Task ResetPasswordAsync(string id, ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await GetUserOrThrowAsync(id, ct);

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        await _userRepository.UpdateAsync(user, ct);
        _logger.LogInformation("Password reset for user {UserId} by admin", id);
    }

    public async Task DeleteAsync(string id, CancellationToken ct = default)
    {
        await GetUserOrThrowAsync(id, ct);
        await _userRepository.DeleteAsync(id, ct);
        _logger.LogInformation("Deleted user {UserId}", id);
    }

    private async Task<User> GetUserOrThrowAsync(string id, CancellationToken ct)
    {
        return await _userRepository.GetByIdAsync(id, ct) ?? throw new NotFoundException(nameof(User), id);
    }

    private static UserDto ToDto(User user, string? className) =>
        new(user.Id, user.FullName, user.Email, user.Role, user.ClassId, className, user.IsActive, user.CreatedAt);
}
