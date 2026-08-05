using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;
using CampusFlow.Infrastructure.Persistence;

namespace CampusFlow.Infrastructure.Repositories;

public class AnnouncementRepository : MongoRepository<Announcement>, IAnnouncementRepository
{
    public AnnouncementRepository(MongoDbContext context) : base(context.Announcements)
    {
    }
}
