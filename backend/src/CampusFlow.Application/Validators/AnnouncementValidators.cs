using CampusFlow.Application.DTOs.Announcements;
using FluentValidation;

namespace CampusFlow.Application.Validators;

public class CreateAnnouncementRequestValidator : AbstractValidator<CreateAnnouncementRequest>
{
    public CreateAnnouncementRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.TargetRole).IsInEnum().When(x => x.TargetRole.HasValue);
    }
}
