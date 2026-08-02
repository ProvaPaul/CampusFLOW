namespace CampusFlow.Domain.Enums;

/// <summary>
/// Submitted: on-time, awaiting review. Late: submitted after the deadline.
/// NeedsRevision: teacher asked the student to resubmit. Graded: marks/feedback finalized.
/// </summary>
public enum SubmissionStatus
{
    Submitted = 0,
    Late = 1,
    NeedsRevision = 2,
    Graded = 3
}
