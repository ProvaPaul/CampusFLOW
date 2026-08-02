namespace CampusFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown when an authenticated user is not permitted to perform the requested
/// action on the requested resource (e.g. a teacher grading another teacher's assignment).
/// </summary>
public class ForbiddenException : Exception
{
    public ForbiddenException(string message) : base(message)
    {
    }
}
