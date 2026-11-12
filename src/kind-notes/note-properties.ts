import type { CachedMetadata } from "obsidian";

export const SESSION_PROPERTY = "session";
export const LINES_PROPERTY = "lines";

const PLUGIN_PROPERTIES = [SESSION_PROPERTY, LINES_PROPERTY];

function isText(value: unknown): value is string {
  return typeof value === "string";
}

export function linesIn(cache: CachedMetadata): string[] | null {
  const properties = cache.frontmatter;
  if (properties === undefined) return [];
  const lines: unknown = properties[LINES_PROPERTY];
  if (lines === undefined || lines === null) return [];
  if (!Array.isArray(lines) || !lines.every(isText)) return null;
  return lines;
}

export function sessionPropertyIn(cache: CachedMetadata): unknown {
  const properties = cache.frontmatter;
  if (properties === undefined) return undefined;
  return properties[SESSION_PROPERTY];
}

function isPluginProperty(name: string): boolean {
  return PLUGIN_PROPERTIES.includes(name);
}

export function holdsOnlyPluginProperties(cache: CachedMetadata): boolean {
  const properties = cache.frontmatter;
  if (properties === undefined) return true;
  return Object.keys(properties).every(isPluginProperty);
}

export function sameLines(first: string[] | null, second: string[]): boolean {
  if (first === null) return false;
  return JSON.stringify(first) === JSON.stringify(second);
}
