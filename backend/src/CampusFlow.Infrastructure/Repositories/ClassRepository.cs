using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class ClassRepository : MongoRepository<Class>, IClassRepository
{
    public ClassRepository(MongoDbContext context) : base(context.Classes)
    {
    }
}
