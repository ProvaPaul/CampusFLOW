using CampusFlow.Application.Interfaces.Infrastructure;

namespace CampusFlow.Application.Tests.TestDoubles;

public class FakeAiProvider : IAiProvider
{
    private readonly Func<string, string>? _responder;

    public FakeAiProvider(bool isEnabled = true, Func<string, string>? responder = null)
    {
        IsEnabled = isEnabled;
        _responder = responder;
    }

    public bool IsEnabled { get; }

    public string? NextResponse { get; set; }

    public Task<string> GenerateAsync(string prompt, CancellationToken ct = default) =>
        Task.FromResult(_responder?.Invoke(prompt) ?? NextResponse ?? "{}");
}
