using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

public class Subject : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// The class/course this subject is taught in.
    /// </summary>
    [BsonRepresentation(BsonType.ObjectId)]
    public string ClassId { get; set; } = string.Empty;
}
