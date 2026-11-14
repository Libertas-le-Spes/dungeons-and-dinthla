import { joinedLines, PropertyLines } from "./property-lines";
import { propertyNextToLoose } from "./property-refusals";

const FENCE = "---";

function endedLine(note: PropertyLines, wanted: string | null): string[] {
  if (wanted === null) return [];
  return [note.ending.ends(wanted)];
}

function spliced(note: PropertyLines, from: number, to: number, added: readonly string[]): string {
  const kept: string[] = [];
  for (const [position, line] of note.lines.entries()) {
    if (position === from) kept.push(...added);
    if (position < from || position >= to) kept.push(line);
  }
  return joinedLines(kept);
}

function withNewBlock(note: PropertyLines, added: readonly string[]): string {
  if (added.length === 0) return joinedLines(note.lines);
  return joinedLines([note.ending.ends(FENCE), ...added, note.ending.ends(FENCE), ...note.lines]);
}

export function withPropertyLine(text: string, key: string, wanted: string | null): string {
  const note = PropertyLines.of(text);
  const added = endedLine(note, wanted);
  if (!note.hasBlock()) return withNewBlock(note, added);
  const span = note.spanOf(key);
  if (span === null) return spliced(note, note.closing(), note.closing(), added);
  if (note.spanIs(span, wanted)) return text;
  if (note.hasLooseLineNextTo(span)) throw propertyNextToLoose(key);
  return spliced(note, span.start, span.end, added);
}
