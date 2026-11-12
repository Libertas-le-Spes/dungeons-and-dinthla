import { addedLinesHiddenWith, CLOSERS_WITHOUT_MATH } from "../../notes/reading/hidden-lines";
import { WOULD_BE_HIDDEN } from "../writing/note-editor";
import type { SessionNote } from "../record/campaign";
import { applySessionChange } from "./apply-session-change";
import type { Check } from "./record-change";
import type { AddedLines, SessionChange } from "./session-change";
import { verdictOf } from "./verdict";

function linesAddedBy(change: SessionChange): AddedLines[] {
  if ("rewrite" in change) return [];
  if (change.added === null) return [];
  const added = [change.added];
  if (change.added.later !== null) added.push({ path: change.added.later.path, lines: change.added.later.lines, later: null });
  return added;
}

function landsHidden(changed: SessionNote[], added: AddedLines): boolean {
  const target = changed.find((session) => session.path === added.path);
  if (target === undefined) return false;
  return addedLinesHiddenWith(CLOSERS_WITHOUT_MATH, target.text, added.lines.length);
}

export function hiddenRefusal(sessions: SessionNote[], change: SessionChange): string | null {
  const changed = applySessionChange(sessions, change).sessions;
  if (linesAddedBy(change).some((added) => landsHidden(changed, added))) return WOULD_BE_HIDDEN;
  return null;
}

export function notHidden<Plan>(sessions: () => SessionNote[], sessionChangeOf: (plan: Plan) => SessionChange): Check<Plan> {
  return (plan) => verdictOf(hiddenRefusal(sessions(), sessionChangeOf(plan)));
}
