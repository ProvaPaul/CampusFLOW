using CampusFlow.Domain.Entities;

namespace CampusFlow.Application.Interfaces.Infrastructure;

public record JwtToken(string Token, DateTime ExpiresAt);

public interface IJwtTokenGenerator
{
    JwtToken GenerateToken(User user);
}
