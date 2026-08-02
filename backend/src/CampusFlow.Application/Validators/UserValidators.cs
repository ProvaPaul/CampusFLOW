using CampusFlow.Application.DTOs.Users;
using CampusFlow.Domain.Enums;
using FluentValidation;

namespace CampusFlow.Application.Validators;

public class CreateUserRequestValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        RuleFor(x => x.Role).IsInEnum();
        RuleFor(x => x.ClassId)
            .NotEmpty()
            .When(x => x.Role == UserRole.Student)
            .WithMessage("ClassId is required for students.");
    }
}

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
    }
}
