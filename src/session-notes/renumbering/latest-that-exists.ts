import type { RenumberingPlan } from "./renumbering-plan";
import type { RenumberingReport } from "./renumbering-words";

export function latestThatExists(plan: RenumberingPlan, report: RenumberingReport): string | null {
  if (plan.latest === null) return null;
  const rename = plan.renames.find((candidate) => candidate.to === plan.latest);
  if (rename === undefined) return plan.latest;
  const notRenamed = report.notRenamed.some((candidate) => candidate.from === rename.from);
  if (notRenamed) return rename.from;
  return plan.latest;
}
