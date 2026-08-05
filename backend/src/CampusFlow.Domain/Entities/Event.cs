using CampusFlow.Domain.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CampusFlow.Domain.Entities;

/// <summary>
/// An academic calendar entry (exam, holiday, meeting, etc.) that isn't derivable from
/// assignment data. Assignment deadlines/publish dates are merged into the calendar view
/// client-side instead of being duplicated here.
/// </summary>
public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public EventType Type { get; set; } = EventType.Other;

    public DateTime StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    /// <summary>Null means the event is school-wide; otherwise it's scoped to one class.</summary>
    [BsonRepresentation(BsonType.ObjectId)]
    public string? ClassId { get; set; }

    [BsonRepresentation(BsonType.ObjectId)]
    public string CreatedByUserId { get; set; } = string.Empty;
}
