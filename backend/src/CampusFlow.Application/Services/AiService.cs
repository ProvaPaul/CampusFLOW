using System.Text.Json;
using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Ai;
using CampusFlow.Application.Interfaces.Infrastructure;
using CampusFlow.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CampusFlow.Application.Services;

public class AiService : IAiService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private readonly IAiProvider _aiProvider;
    private readonly ILogger<AiService> _logger;

    public AiService(IAiProvider aiProvider, ILogger<AiService> logger)
    {
        _aiProvider = aiProvider;
        _logger = logger;
    }

    public bool IsEnabled => _aiProvider.IsEnabled;

    public async Task<GeneratedAssignmentDto> GenerateAssignmentAsync(GenerateAssignmentRequest request, CancellationToken ct = default)
    {
        EnsureEnabled();

        var prompt = $"""
            You are an experienced academic curriculum designer helping a teacher draft a new assignment.

            Subject: {request.Subject}
            Topic: {request.Topic}
            Difficulty: {request.Difficulty}
            Maximum marks: {request.MaxMarks}
            Learning objective: {request.LearningObjective}

            Respond with ONLY a JSON object (no markdown fences, no commentary) with exactly these string fields:
            "title", "description", "requirements", "instructions", "expectedOutcome", "gradingRubric".
            - title: a concise, specific assignment title (not generic).
            - description: 2-4 sentences describing the task.
            - requirements: a newline-separated list of what the student must submit.
            - instructions: a newline-separated list of step-by-step instructions for the student.
            - expectedOutcome: what mastery looks like once the student completes this.
            - gradingRubric: a newline-separated breakdown of how the {request.MaxMarks} marks are allocated across criteria.
            """;

        var raw = await CallAsync(prompt, ct);
        return Parse<GeneratedAssignmentDto>(raw);
    }

    public async Task<GeneratedFeedbackDto> GenerateFeedbackAsync(GenerateFeedbackRequest request, CancellationToken ct = default)
    {
        EnsureEnabled();

        var marksLine = request.Marks.HasValue
            ? $"Marks given: {request.Marks}/{request.MaxMarks}"
            : $"Marks: not yet graded (out of {request.MaxMarks})";

        var prompt = $"""
            You are an experienced teacher writing constructive feedback on a student's assignment submission.

            Assignment: {request.AssignmentTitle}
            {marksLine}
            Student's submitted answer:
            ---
            {request.AnswerText}
            ---

            Respond with ONLY a JSON object (no markdown fences, no commentary) with exactly this field:
            "suggestions": an array of 3 to 5 short, specific, constructive feedback sentences a teacher could use
            as-is or edit before sending to the student. Vary tone across the array (some encouraging, some pointing
            at concrete improvements). Do not restate the grade or marks.
            """;

        var raw = await CallAsync(prompt, ct);
        return Parse<GeneratedFeedbackDto>(raw);
    }

    private void EnsureEnabled()
    {
        if (!_aiProvider.IsEnabled)
        {
            throw new AiUnavailableException();
        }
    }

    private async Task<string> CallAsync(string prompt, CancellationToken ct)
    {
        try
        {
            return await _aiProvider.GenerateAsync(prompt, ct);
        }
        catch (AiUnavailableException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI provider call failed");
            throw new ValidationAppException("AI generation failed right now. Please try again shortly.");
        }
    }

    private T Parse<T>(string raw)
    {
        try
        {
            // Providers sometimes wrap JSON in markdown fences even when asked not to — strip if present.
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```"))
            {
                cleaned = cleaned[cleaned.IndexOf('\n')..];
                cleaned = cleaned[..cleaned.LastIndexOf("```", StringComparison.Ordinal)];
            }

            return JsonSerializer.Deserialize<T>(cleaned, JsonOptions) ?? throw new JsonException("Empty AI response.");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to parse AI response as {Type}: {Raw}", typeof(T).Name, raw);
            throw new ValidationAppException("The AI response could not be understood. Please try again.");
        }
    }
}
