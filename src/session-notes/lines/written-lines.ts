import type { SessionNote, Source } from "../../campaign/record/campaign";
import { withoutBullet } from "../../notes/bullet";
import type { MarkerName } from "../../kinds/marker-name";
import { markerSpanOf } from "../../notes/marker";

export interface WrittenLine {
  source: Source;
  glyph: string;
  marker: MarkerName | null;
  text: string;
}

function writtenLineOf(written: string, source: Source): WrittenLine {
  const line = written.replace(/\r$/, "");
  const span = markerSpanOf(line);
  if (span === null) return { source, glyph: "", marker: null, text: withoutBullet(line) };
  return { source, glyph: line.slice(span.start, span.end), marker: span.marker, text: line.slice(span.end).trim() };
}

function isShown(session: SessionNote, written: string, line: number): boolean {
  return line >= session.firstLine && written.trim() !== "";
}

export function writtenLinesOf(session: SessionNote): WrittenLine[] {
  const lines: WrittenLine[] = [];
  for (const [line, written] of session.text.split("\n").entries()) {
    if (isShown(session, written, line)) lines.push(writtenLineOf(written, { path: session.path, line }));
  }
  return lines;
}
