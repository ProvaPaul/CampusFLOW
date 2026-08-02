using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class SubjectRepository : MongoRepository<Subject>, ISubjectRepository
{
    public SubjectRepository(MongoDbContext context) : base(context.Subjects)
    {
    }
}
