import { PropertyLines } from "./property-lines";

const COLON = ":";

function valueAfterColon(line: string): string {
  return line.substring(line.indexOf(COLON) + COLON.length).trim();
}

export function propertyValueOf(text: string, key: string): string | null {
  const note = PropertyLines.of(text);
  const span = note.spanOf(key);
  if (span === null) return null;
  const lines = note.linesIn(span.start, span.end);
  if (lines.length !== 1) return null;
  return valueAfterColon(lines.join(""));
}
