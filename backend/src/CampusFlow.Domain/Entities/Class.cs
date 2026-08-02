namespace CampusFlow.Domain.Entities;

/// <summary>
/// Represents a class/course (e.g. "Class 10 - Section A" or "BSc CSE - 3rd Semester").
/// </summary>
public class Class : BaseEntity
{
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }
}
