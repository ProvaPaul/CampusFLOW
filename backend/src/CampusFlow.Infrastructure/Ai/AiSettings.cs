namespace CampusFlow.Infrastructure.Ai;

public class AiSettings
{
    public const string SectionName = "Ai";

    /// <summary>Google Gemini API key. When null/empty, all AI features report disabled.</summary>
    public string? ApiKey { get; set; }

    public string Model { get; set; } = "gemini-2.5-flash";
}
