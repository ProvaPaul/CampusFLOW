using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class TeacherAssignmentRepository : MongoRepository<TeacherAssignment>, ITeacherAssignmentRepository
{
    public TeacherAssignmentRepository(MongoDbContext context) : base(context.TeacherAssignments)
    {
    }
}
