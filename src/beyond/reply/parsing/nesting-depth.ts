const STRINGS = /"(?:[^"\\]|\\.)*"/gs;
const OPENERS = new Set(["[", "{"]);
const CLOSERS = new Set(["]", "}"]);

export function deepestNestingOf(text: string): number {
  let depth = 0;
  let deepest = 0;
  for (const character of text.replace(STRINGS, "")) {
    if (OPENERS.has(character)) depth += 1;
    if (CLOSERS.has(character)) depth -= 1;
    if (depth > deepest) deepest = depth;
  }
  return deepest;
}
