import type { SessionNote } from "../../campaign/record/campaign";
import { LINES_FOR_A_NOTE } from "../../kinds/lines-for-a-note";
import { nameKeyOf } from "../../names/name-key";
import { findLinks } from "../../notes/parts/link";
import { noReferenceNoteMessage, refusalForReferenceName, type UndecidedName } from "../making/reference-note-plan";
import { visibleLinesOf } from "./visible-lines";

export interface AskedNames {
  names: UndecidedName[];
  refusals: string[];
}

export interface AskedNamesInput {
  sessions: SessionNote[];
  taken: string[];
}

interface Tally {
  name: string;
  firstSession: SessionNote;
  lineCount: number;
  namedIn: string[];
}

function nameOfLink(target: string): string {
  return target.slice(target.lastIndexOf("/") + 1);
}

function namesOnLine(line: string): Map<string, string> {
  const names = new Map<string, string>();
  for (const target of findLinks(line)) {
    const name = nameOfLink(target);
    if (name !== "") names.set(nameKeyOf(name), name);
  }
  return names;
}

function tallyFor({ tallies, key, started }: { tallies: Map<string, Tally>; key: string; started: Tally }): Tally {
  const found = tallies.get(key);
  if (found !== undefined) return found;
  tallies.set(key, started);
  return started;
}

function tallyOf(sessions: SessionNote[]): Map<string, Tally> {
  const tallies = new Map<string, Tally>();
  for (const session of [...sessions].sort((one, other) => one.number - other.number)) {
    for (const line of visibleLinesOf(session)) {
      for (const [key, name] of namesOnLine(line)) {
        const tally = tallyFor({ tallies, key, started: { name, firstSession: session, lineCount: 0, namedIn: [] } });
        tally.lineCount += 1;
        if (!tally.namedIn.includes(session.path)) tally.namedIn.push(session.path);
      }
    }
  }
  return tallies;
}

export function askedNamesIn({ sessions, taken }: AskedNamesInput): AskedNames {
  const takenKeys = new Set(taken.map(nameKeyOf));
  const asked: AskedNames = { names: [], refusals: [] };
  for (const [key, tally] of tallyOf(sessions)) {
    if (tally.lineCount < LINES_FOR_A_NOTE || takenKeys.has(key)) continue;
    const reason = refusalForReferenceName(tally.name);
    if (reason !== null) {
      asked.refusals.push(noReferenceNoteMessage(tally.name, reason));
      continue;
    }
    asked.names.push({ name: tally.name, firstSession: tally.firstSession, namedIn: tally.namedIn });
  }
  return asked;
}
