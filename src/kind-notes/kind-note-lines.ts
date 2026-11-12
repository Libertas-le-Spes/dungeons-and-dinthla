import type { Campaign, SessionNote, Source } from "../campaign/record/campaign";
import { withoutBullet } from "../notes/parts/bullet";
import { KIND_NOTE_SOURCES } from "./sources/kind-note-sources";

function increasing(first: number, second: number): number {
  return first - second;
}

function sourcesInFolder(campaign: Campaign, folder: string): Source[] {
  const sources: Source[] = [];
  for (const noteSource of KIND_NOTE_SOURCES) {
    if (noteSource.kind.kindNoteFolder === folder) sources.push(...noteSource.sourcesOf(campaign));
  }
  return sources;
}

function lineNumbersIn(sources: Source[], session: SessionNote): number[] {
  const numbers = new Set<number>();
  for (const source of sources) {
    if (source.path === session.path) numbers.add(source.line);
  }
  return [...numbers].sort(increasing);
}

function lineOf(lines: string[], number: number): string {
  const line = lines.at(number);
  if (line === undefined) return "";
  return line;
}

export function kindNoteLines(campaign: Campaign, session: SessionNote, folder: string): string[] {
  const numbers = lineNumbersIn(sourcesInFolder(campaign, folder), session);
  const lines = session.text.split("\n");
  return numbers.map((number) => withoutBullet(lineOf(lines, number)));
}
