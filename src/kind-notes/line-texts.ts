import type { SessionNote, Source } from "../campaign/record/campaign";
import { withoutBullet } from "../notes/parts/bullet";

function increasing(first: number, second: number): number {
  return first - second;
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

export function lineTextsOf(session: SessionNote, sources: Source[]): string[] {
  const lines = session.text.split("\n");
  return lineNumbersIn(sources, session).map((number) => withoutBullet(lineOf(lines, number)));
}
