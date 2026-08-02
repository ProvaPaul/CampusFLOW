using System.Security.Claims;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Domain.Enums;

namespace CampusFlow.Api.Extensions;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public string UserId =>
        _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? throw new InvalidOperationException("No authenticated user in the current request context.");

    public UserRole Role =>
        Enum.Parse<UserRole>(
            _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role)
            ?? throw new InvalidOperationException("No authenticated user in the current request context."));
}
