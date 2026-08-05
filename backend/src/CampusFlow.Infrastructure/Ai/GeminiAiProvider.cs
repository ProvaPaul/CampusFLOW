using System.Net.Http.Json;
using System.Text.Json;
using CampusFlow.Application.Interfaces.Infrastructure;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CampusFlow.Infrastructure.Ai;

/// <summary>Calls Google Gemini's REST generateContent endpoint directly — no SDK dependency.</summary>
public class GeminiAiProvider : IAiProvider
{
    private readonly HttpClient _httpClient;
    private readonly AiSettings _settings;
    private readonly ILogger<GeminiAiProvider> _logger;

    public GeminiAiProvider(HttpClient httpClient, IOptions<AiSettings> settings, ILogger<GeminiAiProvider> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public bool IsEnabled => !string.IsNullOrWhiteSpace(_settings.ApiKey);

    public async Task<string> GenerateAsync(string prompt, CancellationToken ct = default)
    {
        var requestBody = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { temperature = 0.7, responseMimeType = "application/json" }
        };

        var url = $"v1beta/models/{_settings.Model}:generateContent?key={_settings.ApiKey}";

        using var response = await _httpClient.PostAsJsonAsync(url, requestBody, ct);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("Gemini API request failed with {StatusCode}: {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException("The AI provider returned an error.");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return text ?? throw new InvalidOperationException("The AI provider returned an empty response.");
    }
}
