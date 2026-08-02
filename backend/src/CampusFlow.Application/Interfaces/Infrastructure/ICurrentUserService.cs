using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.Interfaces.Infrastructure;

/// <summary>
/// Exposes the identity of the caller for the current request, resolved from the JWT claims.
/// </summary>
public interface ICurrentUserService
{
    string UserId { get; }

    UserRole Role { get; }
}
