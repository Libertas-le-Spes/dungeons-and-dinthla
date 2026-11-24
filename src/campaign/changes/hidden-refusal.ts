import { addedLinesHidden } from "../../notes/reading/hidden-lines";
import { WOULD_BE_HIDDEN } from "../writing/note-editor";
import type { SessionNote } from "../record/campaign";
import { applySessionChange } from "./apply-session-change";
import type { Check } from "./record-change";
import { linesAddedBy, type AddedLines, type SessionChange } from "./session-change";
import { verdictOf } from "./verdict";
import type { PropertiesSyntax } from "../paths/session-file";

function sessionAt(sessions: SessionNote[], path: string): SessionNote | undefined {
  return sessions.find((session) => session.path === path);
}

function landsHidden(changed: SessionNote[], added: AddedLines, syntax: PropertiesSyntax): boolean {
  const target = sessionAt(changed, added.path);
  if (target === undefined) return true;
  return addedLinesHidden(target.text, added.lines.length, syntax);
}

export function hiddenRefusal(sessions: SessionNote[], change: SessionChange, syntax: PropertiesSyntax): string | null {
  const changed = applySessionChange(sessions, change, syntax).sessions;
  const landsInHidden = (added: AddedLines) => landsHidden(changed, added, syntax);
  if (linesAddedBy(change).some(landsInHidden)) return WOULD_BE_HIDDEN;
  return null;
}

export function notHidden<Plan>(sessions: () => SessionNote[], sessionChangeOf: (plan: Plan) => SessionChange, syntax: PropertiesSyntax): Check<Plan> {
  return (plan) => verdictOf(hiddenRefusal(sessions(), sessionChangeOf(plan), syntax));
}
