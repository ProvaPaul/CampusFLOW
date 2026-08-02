using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class SubmissionRepository : MongoRepository<Submission>, ISubmissionRepository
{
    public SubmissionRepository(MongoDbContext context) : base(context.Submissions)
    {
    }
}
