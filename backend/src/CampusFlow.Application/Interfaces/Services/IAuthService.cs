using CampusFlow.Application.DTOs.Auth;

namespace CampusFlow.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
}
