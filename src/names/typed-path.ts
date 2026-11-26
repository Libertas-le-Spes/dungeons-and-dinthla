import type { PathSpelling } from "../host/rules/path-spelling";

export function typedPathOf(typed: string, whenEmpty: string, spelling: PathSpelling): string {
  const trimmed = typed.trim();
  if (trimmed === "") throw new Error(whenEmpty);
  return spelling.storedSpellingOf(trimmed);
}
