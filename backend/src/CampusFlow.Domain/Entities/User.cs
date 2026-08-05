using CampusFlow.Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

public class User : BaseEntity
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    /// <summary>
    /// Populated only for Student accounts — the class/course the student belongs to.
    /// </summary>
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ClassId { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Set on every successful login — powers the admin System Health "recent logins" view.</summary>
    public DateTime? LastLoginAt { get; set; }
}
