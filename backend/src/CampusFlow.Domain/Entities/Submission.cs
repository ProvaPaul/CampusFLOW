using CampusFlow.Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

public class Submission : BaseEntity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string AssignmentId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string StudentId { get; set; } = string.Empty;

    public string AnswerText { get; set; } = string.Empty;

    /// <summary>
    /// Optional link to an attached file (external URL, since file storage is out of scope).
    /// </summary>
    public string? AttachmentUrl { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public double? Marks { get; set; }

    public string? Feedback { get; set; }

    public DateTime? GradedAt { get; set; }
}
