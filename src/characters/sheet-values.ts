import type { SessionNote, Source } from "../campaign/campaign";
import { firstLineAfterProperties } from "../campaign/session-file";
import { forEachSessionLine } from "../campaign/session-lines";
import { withoutBullet } from "../notes/bullet";
import { factsOf, linkedFactsOf, type CharacterFact } from "../notes/character-facts";

export const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const SHEET_NAMES = ["type", "subtitle", "speed", ...ABILITIES, "class", "AC", "HP", "alignment"];

export interface SourcedFact extends CharacterFact {
  source: Source;
}

export type SheetValues = Map<string, string>;

export function sameName(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

export function isSheetName(name: string): boolean {
  return SHEET_NAMES.some((candidate) => sameName(candidate, name));
}

export function sheetNameOf(name: string): string {
  const sheetName = SHEET_NAMES.find((candidate) => sameName(candidate, name));
  if (sheetName === undefined) return name;
  return sheetName;
}

export function factsByCharacter(
  sessions: SessionNote[],
  pathOfLink: (linktext: string, sourcePath: string) => string | null,
): Map<string, SourcedFact[]> {
  const byCharacter = new Map<string, SourcedFact[]>();
  forEachSessionLine(sessions, (line, source) => {
    const linked = linkedFactsOf(line);
    if (linked === null) return;
    const path = pathOfLink(linked.target, source.path);
    if (path === null) return;
    let facts = byCharacter.get(path);
    if (facts === undefined) {
      facts = [];
      byCharacter.set(path, facts);
    }
    facts.push(...linked.facts.map((fact) => ({ ...fact, source })));
  });
  return byCharacter;
}

export function overrideFacts(ownNote: string, path: string): SourcedFact[] {
  const lines = ownNote.split("\n");
  const facts: SourcedFact[] = [];
  for (let line = firstLineAfterProperties(ownNote); line < lines.length; line++) {
    facts.push(...factsOf(withoutBullet(lines[line]!)).map((fact) => ({ ...fact, source: { path, line } })));
  }
  return facts;
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
