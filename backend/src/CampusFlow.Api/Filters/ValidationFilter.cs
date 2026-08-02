using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace CampusFlow.Api.Filters;

/// <summary>
/// Runs the FluentValidation validator (if one is registered) for every action argument
/// before the action executes, short-circuiting with a 400 + field-level errors on failure.
/// </summary>
public class ValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _serviceProvider;

    public ValidationFilter(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var errors = new Dictionary<string, string[]>();

        foreach (var argument in context.ActionArguments.Values)
        {
            if (argument is null)
            {
                continue;
            }

            var validatorType = typeof(IValidator<>).MakeGenericType(argument.GetType());
            if (_serviceProvider.GetService(validatorType) is not IValidator validator)
            {
                continue;
            }

            var validationContext = new ValidationContext<object>(argument);
            var result = await validator.ValidateAsync(validationContext);

            if (!result.IsValid)
            {
                foreach (var group in result.Errors.GroupBy(e => e.PropertyName))
                {
                    errors[group.Key] = group.Select(e => e.ErrorMessage).ToArray();
                }
            }
        }

        if (errors.Count > 0)
        {
            context.Result = new BadRequestObjectResult(new
            {
                status = 400,
                title = "One or more validation errors occurred.",
                errors
            });
            return;
        }

        await next();
    }
}
