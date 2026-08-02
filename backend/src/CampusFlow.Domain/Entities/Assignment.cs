using CampusFlow.Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

public class Assignment : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ClassId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SubjectId { get; set; } = string.Empty;

    /// <summary>
    /// The teacher who owns/created this assignment.
    /// </summary>
    [BsonRepresentation(BsonType.ObjectId)]
    public string TeacherId { get; set; } = string.Empty;

    public DateTime Deadline { get; set; }

    public int MaxMarks { get; set; }

    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;

    /// <summary>
    /// When true, students may update their submission before the deadline.
    /// </summary>
    public bool AllowResubmission { get; set; } = true;
}
