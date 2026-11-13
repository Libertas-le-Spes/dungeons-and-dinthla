import type { TypedText } from "./import-changes";

function sameLines(first: readonly string[], second: readonly string[]): boolean {
  if (first.length !== second.length) return false;
  for (const [position, line] of first.entries()) {
    if (second[position] !== line) return false;
  }
  return true;
}

export function sameTypedText(shown: readonly TypedText[], current: readonly TypedText[]): boolean {
  if (shown.length !== current.length) return false;
  for (const [position, entry] of shown.entries()) {
    const other = current[position];
    if (other === undefined || other.heading !== entry.heading) return false;
    if (!sameLines(entry.lines, other.lines)) return false;
  }
  return true;
}
