using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Domain.Entities;

namespace CampusFlow.Application.Tests.TestDoubles;

public class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => $"hashed:{password}";

    public bool Verify(string password, string passwordHash) => passwordHash == $"hashed:{password}";
}

public class FakeJwtTokenGenerator : IJwtTokenGenerator
{
    public JwtToken GenerateToken(User user) => new($"fake-token-for-{user.Id}", DateTime.UtcNow.AddHours(2));
}
