import { withoutBullet } from "../../notes/parts/bullet";
import type { SessionNote, Source } from "./campaign";

function lineNumbersIn(sources: Source[], session: SessionNote): Set<number> {
  const numbers = new Set<number>();
  for (const source of sources) {
    if (source.path === session.path) numbers.add(source.line);
  }
  return numbers;
}

export function lineTextsOf(session: SessionNote, sources: Source[]): string[] {
  const wanted = lineNumbersIn(sources, session);
  const texts: string[] = [];
  for (const [number, line] of session.text.split("\n").entries()) {
    if (wanted.has(number)) texts.push(withoutBullet(line));
  }
  return texts;
}
