import type { SessionNote } from "../campaign/campaign";
import { firstLineAfterProperties } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import { factsOf, linkedFactsOf, type CharacterFact } from "./character-facts";

export const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const SHEET_NAMES = ["type", "subtitle", "speed", ...ABILITIES, "class", "AC", "HP", "alignment"];

export type SheetValues = Map<string, string>;

function sheetNameOf(name: string): string {
  const sheetName = SHEET_NAMES.find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  if (sheetName === undefined) return name;
  return sheetName;
}

export function learnedFacts(sessions: SessionNote[], isCharacter: (target: string, sourcePath: string) => boolean): CharacterFact[] {
  const facts: CharacterFact[] = [];
  const inOrder = [...sessions].sort((first, second) => first.number - second.number);
  for (const session of inOrder) {
    for (const line of session.text.split("\n")) {
      const linked = linkedFactsOf(line);
      if (linked !== null && isCharacter(linked.target, session.path)) facts.push(...linked.facts);
    }
  }
  return facts;
}

export function overrideFacts(ownNote: string): CharacterFact[] {
  const lines = ownNote.split("\n").slice(firstLineAfterProperties(ownNote));
  return lines.flatMap((line) => factsOf(withoutBullet(line)));
}

export function sheetValuesOf(learned: CharacterFact[], overrides: CharacterFact[]): SheetValues {
  const values: SheetValues = new Map();
  for (const fact of [...learned, ...overrides]) values.set(sheetNameOf(fact.name), fact.value);
  return values;
}

export function modifierOf(score: string): string {
  const written = score.trim();
  if (!/^-?\d+$/.test(written)) return "";
  const modifier = Math.floor((Number.parseInt(written, 10) - 10) / 2);
  if (modifier < 0) return `−${Math.abs(modifier)}`;
  return `+${modifier}`;
}
