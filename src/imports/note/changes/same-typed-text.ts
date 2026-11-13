import type { TypedText } from "./import-changes";

function writtenOut(typed: readonly TypedText[]): string {
  const entries: (string | readonly string[])[][] = [];
  for (const entry of typed) entries.push([entry.heading, entry.lines]);
  return JSON.stringify(entries);
}

export function sameTypedText(shown: readonly TypedText[], current: readonly TypedText[]): boolean {
  return writtenOut(shown) === writtenOut(current);
}
