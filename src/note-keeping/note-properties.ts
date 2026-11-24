import type { Properties } from "../host/notes/note-facts";

export const PLUGIN_PROPERTIES = ["session", "lines"];

function isText(value: unknown): value is string {
  return typeof value === "string";
}

export function linesIn(properties: Properties | null): string[] | null {
  if (properties === null) return [];
  const lines: unknown = properties.lines;
  if (lines === undefined || lines === null) return [];
  if (!Array.isArray(lines) || !lines.every(isText)) return null;
  return lines;
}

export function sessionPropertyIn(properties: Properties | null): unknown {
  if (properties === null) return undefined;
  return properties.session;
}

export function sameLines(first: string[] | null, second: string[]): boolean {
  if (first === null) return false;
  return JSON.stringify(first) === JSON.stringify(second);
}
