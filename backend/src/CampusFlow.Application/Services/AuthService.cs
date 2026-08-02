using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Auth;
using CampusFlow.Application.DTOs.Users;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IClassRepository _classRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IClassRepository classRepository,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _classRepository = classRepository;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email.Trim().ToLowerInvariant(), ct);

        if (user is null || !_passwordHasher.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for {Email}", request.Email);
            throw new ValidationAppException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            _logger.LogWarning("Login attempt for deactivated account {Email}", request.Email);
            throw new ValidationAppException("This account has been deactivated.");
        }

        var token = _jwtTokenGenerator.GenerateToken(user);

        string? className = null;
        if (!string.IsNullOrEmpty(user.ClassId))
        {
            var studentClass = await _classRepository.GetByIdAsync(user.ClassId, ct);
            className = studentClass?.Name;
        }

        var userDto = new UserDto(user.Id, user.FullName, user.Email, user.Role, user.ClassId, className, user.IsActive, user.CreatedAt);

        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        return new AuthResponse(token.Token, token.ExpiresAt, userDto);
    }
}
