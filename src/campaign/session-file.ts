import type { CachedMetadata } from "obsidian";

const SESSION_FILE = /^Session (\d+)\.md$/;

export function sessionNumberOf(path: string, campaignFolder: string): number | null {
  const sessionsFolder = `${campaignFolder}/Sessions/`;
  if (!path.startsWith(sessionsFolder)) return null;
  const match = SESSION_FILE.exec(path.slice(sessionsFolder.length));
  if (match === null) return null;
  return Number.parseInt(match[1]!, 10);
}

export function firstLineAfterProperties(cache: CachedMetadata | null): number {
  const properties = cache?.frontmatterPosition;
  if (properties === undefined) return 0;
  return properties.end.line + 1;
}

export function sessionLabelOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return name.replace(/\.md$/, "");
}
