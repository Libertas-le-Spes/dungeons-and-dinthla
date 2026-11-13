import { neutralLineOf } from "./neutral-line";
import type { Identity, Leaving } from "./record-facts";

const FENCE = "---";
const LINE_BREAK = "\n";
const PART_BREAK = ", ";

function identityLineOf(identity: Identity): string {
  const parts: string[] = [];
  for (const part of [identity.name, identity.species, identity.classes]) {
    if (part === null) continue;
    const line = neutralLineOf(part);
    if (line !== null) parts.push(line);
  }
  return `${parts.join(PART_BREAK)}.`;
}

function leftLineOf(leaving: Leaving): string {
  if (leaving.sessionLink === null) return `${leaving.how} on ${leaving.day}.`;
  return `${leaving.how} on ${leaving.day}, after [[${leaving.sessionLink}]].`;
}

function lastDoingLines(leaving: Leaving): string[] {
  if (leaving.lastDoing === null) return [];
  return [`Last doing: ${leaving.lastDoing}`];
}

export function fallenRecordText(identity: Identity, leaving: Leaving): string {
  const lines = [FENCE, `standing: ${leaving.standing}`, `left: ${leaving.day}`, FENCE, identityLineOf(identity), leftLineOf(leaving), ...lastDoingLines(leaving)];
  return `${lines.join(LINE_BREAK)}${LINE_BREAK}`;
}
