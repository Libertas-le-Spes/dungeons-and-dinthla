import type { SessionNote, Source } from "../../campaign/record/campaign";
import { firstLineAfterProperties, type PropertiesSyntax } from "../../campaign/paths/session-file";
import { forEachSessionLine } from "../../campaign/record/session-lines";
import { withoutBullet } from "../../notes/parts/bullet";
import { factsOf, linkedFactsOf, type CharacterFact } from "../../notes/reading/character-facts";
import { pluginSectionLinesOf } from "../imported/reading/plugin-section-lines";
import type { SourcedFact } from "../facts/sourced-fact";
import { sameName } from "../facts/same-name";

export const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];

const SHEET_NAMES = ["type", "subtitle", "speed", ...ABILITIES, "class", "AC", "HP", "alignment"];

export type { SourcedFact } from "../facts/sourced-fact";
export { sameName } from "../facts/same-name";

export type SheetValues = Map<string, string>;

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

export function overrideFacts(ownNote: string, path: string, syntax: PropertiesSyntax): SourcedFact[] {
  const lines = ownNote.split("\n");
  const facts: SourcedFact[] = [];
  const bodyStart = firstLineAfterProperties(ownNote, syntax);
  const skipped = pluginSectionLinesOf(lines, bodyStart);
  for (let line = bodyStart; line < lines.length; line++) {
    if (skipped.has(line)) continue;
    facts.push(...factsOf(withoutBullet(lines[line]!)).map((fact) => ({ ...fact, source: { path, line } })));
  }
  return facts;
}

export function sheetValuesOf(learned: CharacterFact[], imported: CharacterFact[], overrides: CharacterFact[]): SheetValues {
  const values: SheetValues = new Map();
  for (const fact of [...learned, ...imported, ...overrides]) values.set(sheetNameOf(fact.name), fact.value);
  return values;
}

export function modifierOf(score: string): string {
  const written = score.trim();
  if (!/^-?\d+$/.test(written)) return "";
  const modifier = Math.floor((Number.parseInt(written, 10) - 10) / 2);
  if (modifier < 0) return `−${Math.abs(modifier)}`;
  return `+${modifier}`;
}
