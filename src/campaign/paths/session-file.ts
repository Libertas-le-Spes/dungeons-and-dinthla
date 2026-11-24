import type { NoteSyntax } from "../../host/rules/note-syntax";
import type { SessionNote } from "../record/campaign";

export type PropertiesSyntax = Pick<NoteSyntax, "propertiesIn" | "readProperties">;

const SESSION_FILE = /^Session (\d+)\.md$/;

export function sessionNumberOf(path: string, campaignFolder: string): number | null {
  const sessionsFolder = `${campaignFolder}/Sessions/`;
  if (!path.startsWith(sessionsFolder)) return null;
  const match = SESSION_FILE.exec(path.slice(sessionsFolder.length));
  if (match === null) return null;
  return Number.parseInt(match[1]!, 10);
}

export function firstLineAfterProperties(text: string, syntax: PropertiesSyntax): number {
  const properties = syntax.propertiesIn(text);
  if (!properties.exists) return 0;
  const before = text.slice(0, properties.contentStart);
  const linesBefore = before.split("\n").length - 1;
  if (before.endsWith("\n")) return linesBefore;
  return linesBefore + 1;
}

function propertiesOf(text: string, syntax: PropertiesSyntax): string {
  const lines = text.split("\n").slice(0, firstLineAfterProperties(text, syntax));
  return lines.map((line) => line.replace(/\r$/, "")).join("\n");
}

export function keepsProperties(before: string, after: string, syntax: PropertiesSyntax): boolean {
  return propertiesOf(before, syntax) === propertiesOf(after, syntax);
}

export function sessionNoteOf(path: string, number: number, text: string, syntax: PropertiesSyntax): SessionNote {
  return { path, number, text, firstLine: firstLineAfterProperties(text, syntax) };
}

export function sessionLabelOf(path: string): string {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return name.replace(/\.md$/, "");
}
