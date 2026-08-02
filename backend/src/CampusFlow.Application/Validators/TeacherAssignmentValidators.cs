using CampusFlow.Application.DTOs.TeacherAssignments;
using FluentValidation;

namespace CampusFlow.Application.Validators;

public class CreateTeacherAssignmentRequestValidator : AbstractValidator<CreateTeacherAssignmentRequest>
{
    public CreateTeacherAssignmentRequestValidator()
    {
        RuleFor(x => x.TeacherId).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
        RuleFor(x => x.ClassId).NotEmpty();
    }
}
