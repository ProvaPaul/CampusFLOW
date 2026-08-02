using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

/// <summary>
/// Maps a teacher to a subject within a class/course, granting them the right
/// to create assignments and grade submissions for that subject/class pair.
/// </summary>
public class TeacherAssignment : BaseEntity
{
    [BsonRepresentation(BsonType.ObjectId)]
    public string TeacherId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string SubjectId { get; set; } = string.Empty;

    [BsonRepresentation(BsonType.ObjectId)]
    public string ClassId { get; set; } = string.Empty;
}
