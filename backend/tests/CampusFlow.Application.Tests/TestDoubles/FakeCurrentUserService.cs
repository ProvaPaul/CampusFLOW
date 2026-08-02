using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Domain.Enums;

namespace CampusFlow.Application.Tests.TestDoubles;

public class FakeCurrentUserService : ICurrentUserService
{
    public FakeCurrentUserService(string userId, UserRole role)
    {
        UserId = userId;
        Role = role;
    }

    public string UserId { get; set; }

    public UserRole Role { get; set; }
}
