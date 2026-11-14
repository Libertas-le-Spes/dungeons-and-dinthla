import { standingIn } from "../../layout/standing";
import { plainLineOf } from "../../note/reading/line-ending";
import { PropertyLines } from "./property-lines";

const COLON = ":";

function valueAfterColon(line: string): string {
  return line.substring(line.indexOf(COLON) + COLON.length).trim();
}

export function valuesOf(text: string, key: string): string[] | null {
  const note = PropertyLines.of(text);
  const span = note.spanOf(key);
  if (span === null) return null;
  return note.linesIn(span.start, span.end).map((line) => valueAfterColon(plainLineOf(line)));
}

export function standingOf(text: string): string | null {
  const note = PropertyLines.of(text);
  return standingIn(note.lines, note.bodyStart);
}
