namespace CampusFlow.Application.Common.Exceptions;

/// <summary>
/// Thrown when a request conflicts with existing state, e.g. registering a duplicate email.
/// </summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message)
    {
    }
}
