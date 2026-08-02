using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;
using MongoDB.Driver;

namespace CampusFlow.Infrastructure.Repositories;

public class UserRepository : MongoRepository<User>, IUserRepository
{
    public UserRepository(MongoDbContext context) : base(context.Users)
    {
    }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        await Collection.Find(u => u.Email == email).FirstOrDefaultAsync(ct);
}
