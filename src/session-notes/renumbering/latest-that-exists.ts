import type { RenumberingPlan, SessionRename } from "./renumbering-plan";
import { renameSourceGoneWords, type RenumberingReport } from "./renumbering-words";

function isGone(rename: SessionRename, report: RenumberingReport): boolean {
  return report.renameFailure === renameSourceGoneWords(rename.from);
}

function isNotRenamed(rename: SessionRename, report: RenumberingReport): boolean {
  return report.notRenamed.some((candidate) => candidate.from === rename.from);
}

function currentPathOf(rename: SessionRename, report: RenumberingReport): string | null {
  if (!isNotRenamed(rename, report)) return rename.to;
  if (isGone(rename, report)) return null;
  return rename.from;
}

function highestFirst(first: SessionRename, second: SessionRename): number {
  return second.toNumber - first.toNumber;
}

export function latestThatExists(plan: RenumberingPlan, report: RenumberingReport): string | null {
  if (plan.latest === null) return null;
  const latest = plan.renames.find((candidate) => candidate.to === plan.latest);
  if (latest === undefined) return plan.latest;
  const upToLatest = plan.renames.filter((candidate) => candidate.toNumber <= latest.toNumber);
  for (const rename of upToLatest.sort(highestFirst)) {
    const path = currentPathOf(rename, report);
    if (path !== null) return path;
  }
  return null;
}
