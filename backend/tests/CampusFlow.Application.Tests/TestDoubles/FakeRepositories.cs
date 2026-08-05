using CampusFlow.Application.Interfaces.Repositories;
using CampusFlow.Domain.Entities;

namespace CampusFlow.Application.Tests.TestDoubles;

public class FakeUserRepository : InMemoryRepository<User>, IUserRepository
{
    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default) =>
        Task.FromResult(Items.FirstOrDefault(u => u.Email == email));
}

public class FakeClassRepository : InMemoryRepository<Class>, IClassRepository
{
}

public class FakeSubjectRepository : InMemoryRepository<Subject>, ISubjectRepository
{
}

public class FakeTeacherAssignmentRepository : InMemoryRepository<TeacherAssignment>, ITeacherAssignmentRepository
{
}

public class FakeAssignmentRepository : InMemoryRepository<Assignment>, IAssignmentRepository
{
}

public class FakeSubmissionRepository : InMemoryRepository<Submission>, ISubmissionRepository
{
}

public class FakeEventRepository : InMemoryRepository<Event>, IEventRepository
{
}

public class FakeAnnouncementRepository : InMemoryRepository<Announcement>, IAnnouncementRepository
{
}
