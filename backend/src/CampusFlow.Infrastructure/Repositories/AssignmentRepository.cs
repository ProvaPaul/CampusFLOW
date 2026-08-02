using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class AssignmentRepository : MongoRepository<Assignment>, IAssignmentRepository
{
    public AssignmentRepository(MongoDbContext context) : base(context.Assignments)
    {
    }
}
