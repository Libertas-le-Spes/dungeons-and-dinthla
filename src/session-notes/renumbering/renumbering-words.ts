import type { SessionRename } from "./renumbering-plan";

export interface RenumberingReport {
  renamed: SessionRename[];
  notRenamed: SessionRename[];
  renameFailure: string | null;
  linksNotUpdated: string[];
  linksLeft: string[];
}

export const SESSIONS_CHANGED_SINCE_ASKED = "the sessions changed since you were asked, so nothing was deleted. Look at the session again first.";

export const NOT_IN_A_CAMPAIGN = "The session isn't in a campaign, so the sessions can't be numbered again. Nothing was deleted.";

function listed(items: string[]): string {
  const rest = [...items];
  const last = rest.pop();
  if (last === undefined) return "";
  if (rest.length === 0) return last;
  return `${rest.join(", ")} and ${last}`;
}

function sessionsWord(count: number): string {
  if (count === 1) return "Session";
  return "Sessions";
}

function becomeWord(count: number): string {
  if (count === 1) return "becomes";
  return "become";
}

export function movesWords(renames: SessionRename[]): string {
  if (renames.length === 0) return "";
  const from = listed(renames.map((rename) => String(rename.fromNumber)));
  const to = listed(renames.map((rename) => String(rename.toNumber)));
  return `${sessionsWord(renames.length)} ${from} ${becomeWord(renames.length)} ${to}.`;
}

function renamesListed(renames: SessionRename[]): string {
  if (renames.length === 0) return "none";
  return renames.map((rename) => `Session ${rename.fromNumber} to Session ${rename.toNumber}`).join(", ");
}

function renameFailureWords(report: RenumberingReport, failure: string): string {
  const stopped = `Numbering the sessions again stopped: ${failure}`;
  const done = `Renamed: ${renamesListed(report.renamed)}. Not renamed: ${renamesListed(report.notRenamed)}.`;
  return `${stopped} ${done} No links were updated.`;
}

function linkWords(report: RenumberingReport): string[] {
  const words: string[] = [];
  if (report.linksNotUpdated.length > 0) words.push(`Links weren't updated in: ${report.linksNotUpdated.join(", ")}.`);
  if (report.linksLeft.length > 0) {
    words.push(`These notes link to a Session that more than one campaign has, so those links were left as written: ${report.linksLeft.join(", ")}.`);
  }
  return words;
}

export function reportWordsOf(report: RenumberingReport): string | null {
  if (report.renameFailure !== null) return renameFailureWords(report, report.renameFailure);
  const words = linkWords(report);
  if (words.length === 0) return null;
  return words.join(" ");
}
