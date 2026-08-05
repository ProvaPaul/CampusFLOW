namespace CampusFlow.Application.Interfaces.Infrastructure;

/// <summary>
/// Thin abstraction over a generative-text AI provider (Gemini today). Keeping this
/// provider-agnostic means swapping providers later only touches the Infrastructure layer.
/// </summary>
public interface IAiProvider
{
    /// <summary>True when an API key is configured for this deployment.</summary>
    bool IsEnabled { get; }

    /// <summary>Sends a prompt and returns the raw text response.</summary>
    Task<string> GenerateAsync(string prompt, CancellationToken ct = default);
}
