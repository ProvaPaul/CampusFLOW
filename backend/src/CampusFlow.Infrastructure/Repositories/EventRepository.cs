using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class EventRepository : MongoRepository<Event>, IEventRepository
{
    public EventRepository(MongoDbContext context) : base(context.Events)
    {
    }
}
