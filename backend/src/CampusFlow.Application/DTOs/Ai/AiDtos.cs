namespace CampusFlow.Application.DTOs.Ai;

public record AiStatusDto(bool Enabled);

public record GenerateAssignmentRequest(string Subject, string Topic, string Difficulty, int MaxMarks, string LearningObjective);

public record GeneratedAssignmentDto(
    string Title,
    string Description,
    string Requirements,
    string Instructions,
    string ExpectedOutcome,
    string GradingRubric);

public record GenerateFeedbackRequest(string AssignmentTitle, string AnswerText, int? Marks, int MaxMarks);

public record GeneratedFeedbackDto(List<string> Suggestions);
