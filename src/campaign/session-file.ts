import { getFrontMatterInfo } from "obsidian";
import type { SessionNote } from "./campaign";

const SESSION_FILE = /^Session (\d+)\.md$/;

export function sessionNumberOf(path: string, campaignFolder: string): number | null {
  const sessionsFolder = `${campaignFolder}/Sessions/`;
  if (!path.startsWith(sessionsFolder)) return null;
  const match = SESSION_FILE.exec(path.slice(sessionsFolder.length));
  if (match === null) return null;
  return Number.parseInt(match[1]!, 10);
}

export function firstLineAfterProperties(text: string): number {
  const properties = getFrontMatterInfo(text);
  if (!properties.exists) return 0;
  const before = text.slice(0, properties.contentStart);
  const linesBefore = before.split("\n").length - 1;
  if (before.endsWith("\n")) return linesBefore;
  return linesBefore + 1;
}

export function sessionNoteOf(path: string, number: number, text: string): SessionNote {
  return { path, number, text, firstLine: firstLineAfterProperties(text) };
}

export function sessionLabelOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return name.replace(/\.md$/, "");
}
