using CampusFlow.Application.Common.Exceptions;
using CampusFlow.Application.DTOs.Ai;
using CampusFlow.Application.Services;
using CampusFlow.Application.Tests.TestDoubles;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace CampusFlow.Application.Tests.Services;

public class AiServiceTests
{
    [Fact]
    public void IsEnabled_ReflectsProviderState()
    {
        var sutEnabled = new AiService(new FakeAiProvider(isEnabled: true), NullLogger<AiService>.Instance);
        var sutDisabled = new AiService(new FakeAiProvider(isEnabled: false), NullLogger<AiService>.Instance);

        sutEnabled.IsEnabled.Should().BeTrue();
        sutDisabled.IsEnabled.Should().BeFalse();
    }

    [Fact]
    public async Task GenerateAssignmentAsync_WhenProviderDisabled_ThrowsAiUnavailable()
    {
        var sut = new AiService(new FakeAiProvider(isEnabled: false), NullLogger<AiService>.Instance);

        var act = () => sut.GenerateAssignmentAsync(new GenerateAssignmentRequest("Math", "Algebra", "Medium", 100, "Solve equations"));

        await act.Should().ThrowAsync<AiUnavailableException>();
    }

    [Fact]
    public async Task GenerateAssignmentAsync_WithValidJsonResponse_ReturnsParsedDto()
    {
        var provider = new FakeAiProvider(isEnabled: true)
        {
            NextResponse = """
                {"title":"Quadratic Equations","description":"Solve quadratics.","requirements":"Show work",
                "instructions":"Do all 5 problems","expectedOutcome":"Understand the quadratic formula","gradingRubric":"20 marks each"}
                """
        };
        var sut = new AiService(provider, NullLogger<AiService>.Instance);

        var result = await sut.GenerateAssignmentAsync(new GenerateAssignmentRequest("Math", "Quadratics", "Hard", 100, "Master the formula"));

        result.Title.Should().Be("Quadratic Equations");
        result.GradingRubric.Should().Be("20 marks each");
    }

    [Fact]
    public async Task GenerateAssignmentAsync_WithMarkdownFencedJson_StripsFencesBeforeParsing()
    {
        var provider = new FakeAiProvider(isEnabled: true)
        {
            NextResponse = "```json\n{\"title\":\"T\",\"description\":\"D\",\"requirements\":\"R\",\"instructions\":\"I\",\"expectedOutcome\":\"E\",\"gradingRubric\":\"G\"}\n```"
        };
        var sut = new AiService(provider, NullLogger<AiService>.Instance);

        var result = await sut.GenerateAssignmentAsync(new GenerateAssignmentRequest("Math", "Topic", "Easy", 50, "Objective"));

        result.Title.Should().Be("T");
    }

    [Fact]
    public async Task GenerateAssignmentAsync_WithMalformedJson_ThrowsValidationAppException()
    {
        var provider = new FakeAiProvider(isEnabled: true) { NextResponse = "not json at all" };
        var sut = new AiService(provider, NullLogger<AiService>.Instance);

        var act = () => sut.GenerateAssignmentAsync(new GenerateAssignmentRequest("Math", "Topic", "Easy", 50, "Objective"));

        await act.Should().ThrowAsync<ValidationAppException>();
    }

    [Fact]
    public async Task GenerateFeedbackAsync_WithValidJsonResponse_ReturnsSuggestions()
    {
        var provider = new FakeAiProvider(isEnabled: true)
        {
            NextResponse = """{"suggestions":["Great job overall.","Consider explaining your reasoning more."]}"""
        };
        var sut = new AiService(provider, NullLogger<AiService>.Instance);

        var result = await sut.GenerateFeedbackAsync(new GenerateFeedbackRequest("Algebra Worksheet", "My answer text", 85, 100));

        result.Suggestions.Should().HaveCount(2);
        result.Suggestions.Should().Contain("Great job overall.");
    }

    [Fact]
    public async Task GenerateFeedbackAsync_WhenProviderDisabled_ThrowsAiUnavailable()
    {
        var sut = new AiService(new FakeAiProvider(isEnabled: false), NullLogger<AiService>.Instance);

        var act = () => sut.GenerateFeedbackAsync(new GenerateFeedbackRequest("Title", "Answer", null, 100));

        await act.Should().ThrowAsync<AiUnavailableException>();
    }
}
