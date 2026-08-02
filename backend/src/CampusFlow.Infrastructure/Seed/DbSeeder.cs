using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Domain.Entities;
using CampusFlow.Domain.Enums;
using CampusFlow.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace CampusFlow.Infrastructure.Seed;

/// <summary>
/// Seeds demo data on startup so the app is usable immediately after `docker compose up` /
/// `dotnet run`, without any manual database setup. Idempotent: skips if users already exist.
/// </summary>
public class DbSeeder
{
    private readonly MongoDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(MongoDbContext context, IPasswordHasher passwordHasher, ILogger<DbSeeder> logger)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task EnsureIndexesAsync()
    {
        var emailIndex = new CreateIndexModel<User>(
            Builders<User>.IndexKeys.Ascending(u => u.Email),
            new CreateIndexOptions { Unique = true });
        await _context.Users.Indexes.CreateOneAsync(emailIndex);
    }

    public async Task SeedAsync()
    {
        if (await _context.Users.Find(FilterDefinition<User>.Empty).AnyAsync())
        {
            _logger.LogInformation("Database already contains data. Skipping seed.");
            return;
        }

        _logger.LogInformation("Seeding demo data...");

        var classA = new Class { Name = "Class 10 - Section A", Description = "Secondary school, section A" };
        var classCse = new Class { Name = "BSc CSE - 3rd Semester", Description = "Undergraduate Computer Science" };
        await _context.Classes.InsertManyAsync(new[] { classA, classCse });

        var math = new Subject { Name = "Mathematics", Code = "MATH101", ClassId = classA.Id };
        var english = new Subject { Name = "English", Code = "ENG101", ClassId = classA.Id };
        var physics = new Subject { Name = "Physics", Code = "PHY101", ClassId = classA.Id };
        var dataStructures = new Subject { Name = "Data Structures", Code = "CSE201", ClassId = classCse.Id };
        var databaseSystems = new Subject { Name = "Database Systems", Code = "CSE202", ClassId = classCse.Id };
        await _context.Subjects.InsertManyAsync(new[] { math, english, physics, dataStructures, databaseSystems });

        var admin = new User
        {
            FullName = "Admin User",
            Email = "admin@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Admin@123"),
            Role = UserRole.Admin
        };

        var teacher1 = new User
        {
            FullName = "Rahim Uddin",
            Email = "teacher1@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Teacher@123"),
            Role = UserRole.Teacher
        };

        var teacher2 = new User
        {
            FullName = "Fatema Begum",
            Email = "teacher2@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Teacher@123"),
            Role = UserRole.Teacher
        };

        var student1 = new User
        {
            FullName = "Karim Hossain",
            Email = "student1@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Student@123"),
            Role = UserRole.Student,
            ClassId = classA.Id
        };

        var student2 = new User
        {
            FullName = "Nusrat Jahan",
            Email = "student2@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Student@123"),
            Role = UserRole.Student,
            ClassId = classA.Id
        };

        var student3 = new User
        {
            FullName = "Tanvir Ahmed",
            Email = "student3@campusflow.edu",
            PasswordHash = _passwordHasher.Hash("Student@123"),
            Role = UserRole.Student,
            ClassId = classCse.Id
        };

        await _context.Users.InsertManyAsync(new[] { admin, teacher1, teacher2, student1, student2, student3 });

        var teacherAssignments = new[]
        {
            new TeacherAssignment { TeacherId = teacher1.Id, SubjectId = math.Id, ClassId = classA.Id },
            new TeacherAssignment { TeacherId = teacher1.Id, SubjectId = physics.Id, ClassId = classA.Id },
            new TeacherAssignment { TeacherId = teacher2.Id, SubjectId = dataStructures.Id, ClassId = classCse.Id },
            new TeacherAssignment { TeacherId = teacher2.Id, SubjectId = databaseSystems.Id, ClassId = classCse.Id }
        };
        await _context.TeacherAssignments.InsertManyAsync(teacherAssignments);

        var algebraAssignment = new Assignment
        {
            Title = "Algebra Basics Worksheet",
            Description = "Solve the 10 algebra problems attached and show your work.",
            ClassId = classA.Id,
            SubjectId = math.Id,
            TeacherId = teacher1.Id,
            Deadline = DateTime.UtcNow.AddDays(7),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            AllowResubmission = true
        };

        var physicsAssignment = new Assignment
        {
            Title = "Newton's Laws Quiz",
            Description = "Short-answer quiz covering Newton's three laws of motion.",
            ClassId = classA.Id,
            SubjectId = physics.Id,
            TeacherId = teacher1.Id,
            Deadline = DateTime.UtcNow.AddDays(10),
            MaxMarks = 50,
            Status = AssignmentStatus.Draft,
            AllowResubmission = true
        };

        var linkedListAssignment = new Assignment
        {
            Title = "Linked List Implementation",
            Description = "Implement a singly linked list with insert, delete, and search operations.",
            ClassId = classCse.Id,
            SubjectId = dataStructures.Id,
            TeacherId = teacher2.Id,
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            AllowResubmission = true
        };

        var erDiagramAssignment = new Assignment
        {
            Title = "ER Diagram Design",
            Description = "Design an ER diagram for a library management system.",
            ClassId = classCse.Id,
            SubjectId = databaseSystems.Id,
            TeacherId = teacher2.Id,
            Deadline = DateTime.UtcNow.AddDays(-2),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            AllowResubmission = false
        };

        await _context.Assignments.InsertManyAsync(new[] { algebraAssignment, physicsAssignment, linkedListAssignment, erDiagramAssignment });

        var submissions = new[]
        {
            new Submission
            {
                AssignmentId = algebraAssignment.Id,
                StudentId = student1.Id,
                AnswerText = "Answers attached: 1) x=5 2) y=12 ... (worked solutions for all 10 problems)",
                SubmittedAt = DateTime.UtcNow.AddDays(-1),
                Status = SubmissionStatus.Submitted
            },
            new Submission
            {
                AssignmentId = algebraAssignment.Id,
                StudentId = student2.Id,
                AnswerText = "Completed all 10 problems, solutions attached.",
                SubmittedAt = DateTime.UtcNow.AddDays(-2),
                Status = SubmissionStatus.Graded,
                Marks = 85,
                Feedback = "Well done overall — small mistake in question 4's factoring step.",
                GradedAt = DateTime.UtcNow.AddDays(-1)
            },
            new Submission
            {
                AssignmentId = erDiagramAssignment.Id,
                StudentId = student3.Id,
                AnswerText = "ER diagram submitted as described, entities: Book, Member, Loan, Staff.",
                SubmittedAt = DateTime.UtcNow.AddDays(-1),
                Status = SubmissionStatus.Graded,
                Marks = 78,
                Feedback = "Good structure, but missing cardinality notation on two relationships. Submitted after the deadline.",
                GradedAt = DateTime.UtcNow
            }
        };

        await _context.Submissions.InsertManyAsync(submissions);

        _logger.LogInformation("Demo data seeded: {Classes} classes, {Subjects} subjects, {Users} users, {Assignments} assignments, {Submissions} submissions",
            2, 5, 6, 4, submissions.Length);
    }
}
