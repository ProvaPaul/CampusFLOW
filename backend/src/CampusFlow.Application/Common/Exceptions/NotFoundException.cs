namespace CampusFlow.Application.Common.Exceptions;

public class NotFoundException : Exception
{
    public NotFoundException(string entityName, string id)
        : base($"{entityName} with id '{id}' was not found.")
    {
    }

    public NotFoundException(string message) : base(message)
    {
    }
}
