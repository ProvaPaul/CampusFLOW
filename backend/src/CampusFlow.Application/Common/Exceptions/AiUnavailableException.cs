namespace CampusFlow.Application.Common.Exceptions;

/// <summary>Thrown when an AI-powered endpoint is called but no provider API key is configured.</summary>
public class AiUnavailableException : Exception
{
    public AiUnavailableException()
        : base("AI features are not available right now — no API key is configured for this deployment.")
    {
    }
}
