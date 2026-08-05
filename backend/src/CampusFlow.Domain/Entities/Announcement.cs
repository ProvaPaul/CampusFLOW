using CampusFlow.Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

/// <summary>An admin-authored broadcast message — the one notification type with no other data source.</summary>
public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    /// <summary>Null means visible to every role.</summary>
    public UserRole? TargetRole { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedByUserId { get; set; } = string.Empty;
}
