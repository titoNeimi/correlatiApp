import { SubjectDTO, SubjectStatus } from "@/types/subjects";

type RequirementMinStatus = "passed" | "final_pending";

type SubjectRequirementDTO = {
  id: string;
  minStatus?: RequirementMinStatus; // default: "passed"
};

export function computeAvailability(subjects: SubjectDTO[]): SubjectDTO[] {
  const APPROVED_STATUSES: Set<SubjectStatus> = new Set([
    "passed",
    "passed_with_distinction",
  ]);

  const FINAL_PENDING_OK_STATUSES: Set<SubjectStatus> = new Set([
    "final_pending",
    "passed",
    "passed_with_distinction",
  ]);

  const STRONG_STATUSES: Set<SubjectStatus> = new Set([
    "passed",
    "passed_with_distinction",
    "in_progress",
    "final_pending",
  ]);

  const statusById = new Map<string, SubjectStatus>(
    subjects.map((s) => [s.id, s.status])
  );

  return subjects.map((subject) => {
    const updated = { ...subject };

    const reqs = (updated.requirements ?? []) as unknown as SubjectRequirementDTO[];

    const meetsRequirement = (req: SubjectRequirementDTO): boolean => {
      const reqStatus = statusById.get(req.id);
      if (!reqStatus) return false;

      const min = req.minStatus ?? "passed";

      if (min === "final_pending") {
        return FINAL_PENDING_OK_STATUSES.has(reqStatus);
      }
      // default: passed
      return APPROVED_STATUSES.has(reqStatus);
    };

    const allSatisfied = reqs.length === 0 ? true : reqs.every(meetsRequirement);

    if (!allSatisfied) {
      if (!APPROVED_STATUSES.has(updated.status)) {
        updated.status = "not_available";
      }
      return updated;
    }

    if (STRONG_STATUSES.has(updated.status)) return updated;

    updated.status = "available";
    return updated;
  });
}
