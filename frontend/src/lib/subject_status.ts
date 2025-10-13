import { SubjectDTO, SubjectStatus } from "@/types/subjects";

export function computeAvailability(subjects: SubjectDTO[]): SubjectDTO[] {
  const APPROVED_STATUSES: Set<SubjectStatus> = new Set([
    'passed',
    'passed_with_distinction',
  ]);

  const STRONG_STATUSES: Set<SubjectStatus> = new Set([
    'passed',
    'passed_with_distinction',
    'in_progress',
    'final_pending',
  ]);

  const approvedIds = new Set(
    subjects.filter((s) => APPROVED_STATUSES.has(s.status)).map((s) => s.id)
  );

  return subjects.map((subject) => {
    const updated = { ...subject };
    if (STRONG_STATUSES.has(updated.status)) return updated;
    const reqs = updated.requirements ?? [];

    if (reqs.length === 0) {
      updated.status = 'available';
      return updated;
    }

    const allRequirementsApproved = reqs.every((reqId) =>
      approvedIds.has(reqId)
    );

    updated.status = allRequirementsApproved ? 'available' : 'not_available';
    return updated;
  });
}