namespace CampusFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown when a business rule (not a FluentValidation input rule) is violated,
/// e.g. submitting after a deadline or marks exceeding the assignment's max marks.
/// </summary>
public class ValidationAppException : Exception
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationAppException(string message) : base(message)
    {
        Errors = new Dictionary<string, string[]> { { "General", new[] { message } } };
    }

    public ValidationAppException(IDictionary<string, string[]> errors) : base("One or more validation errors occurred.")
    {
        Errors = errors;
    }
}
