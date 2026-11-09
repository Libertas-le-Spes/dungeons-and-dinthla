import { normalizePath } from "obsidian";

export function typedPathOf(typed: string, whenEmpty: string): string {
  const trimmed = typed.trim();
  if (trimmed === "") throw new Error(whenEmpty);
  return normalizePath(trimmed);
}
