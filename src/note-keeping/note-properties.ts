import type { CachedMetadata } from "obsidian";

export const PLUGIN_PROPERTIES = ["session", "lines"];

function isText(value: unknown): value is string {
  return typeof value === "string";
}

export function linesIn(cache: CachedMetadata): string[] | null {
  const properties = cache.frontmatter;
  if (properties === undefined) return [];
  const lines: unknown = properties.lines;
  if (lines === undefined || lines === null) return [];
  if (!Array.isArray(lines) || !lines.every(isText)) return null;
  return lines;
}

export function sessionPropertyIn(cache: CachedMetadata): unknown {
  const properties = cache.frontmatter;
  if (properties === undefined) return undefined;
  return properties.session;
}

export function sameLines(first: string[] | null, second: string[]): boolean {
  if (first === null) return false;
  return JSON.stringify(first) === JSON.stringify(second);
}
