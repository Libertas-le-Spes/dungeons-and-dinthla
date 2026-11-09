import type { CampaignStore } from "../campaign/campaign-store";
import type { NoteTexts } from "../campaign/note-texts";
import { sessionLinesOf } from "../campaign/session-lines";

export interface LinkFrom {
  path: string;
  line: number | null;
}

export interface LinkLines {
  sessions: Pick<CampaignStore, "sessionNotes">;
  texts: Pick<NoteTexts, "read">;
}

function lineAt(lines: string[], line: number): string {
  const found = lines[line];
  if (found === undefined) return "";
  return found;
}

export async function linkLineOf(lines: LinkLines, from: LinkFrom): Promise<string> {
  if (from.line === null) return "";
  const session = lines.sessions.sessionNotes.find((note) => note.path === from.path);
  if (session !== undefined) return lineAt(sessionLinesOf(session), from.line);
  const text = await lines.texts.read(from.path);
  if (text === null) return "";
  return lineAt(text.split("\n"), from.line);
}
