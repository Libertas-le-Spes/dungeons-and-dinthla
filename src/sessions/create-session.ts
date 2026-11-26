import { sessionNumberOf } from "../campaign/paths/session-file";
import type { NoteKeeping } from "../host/notes/note-keeping";
import type { NoteRef } from "../host/notes/note-ref";
import type { NoteStore } from "../host/notes/note-store";

export type SessionFiles = Pick<NoteStore, "files" | "hasFolder" | "makeFolder" | "make">;
export type SessionFileActions = Pick<NoteKeeping, "changeProperties">;

export interface SessionMaking {
  readonly store: SessionFiles;
  readonly keeping: SessionFileActions;
}

export interface NewSession {
  title: string;
  played: string;
}

export function nextSessionNumber(paths: string[], campaignFolder: string): number {
  let highest = 0;
  for (const path of paths) {
    const number = sessionNumberOf(path, campaignFolder);
    if (number !== null && number > highest) highest = number;
  }
  return highest + 1;
}

export async function createSession(
  files: SessionFiles,
  actions: SessionFileActions,
  campaignFolder: string,
  session: NewSession,
): Promise<NoteRef> {
  const sessionsFolder = `${campaignFolder}/Sessions`;
  if (!files.hasFolder(sessionsFolder)) await files.makeFolder(sessionsFolder);
  const number = nextSessionNumber(files.files().map((file) => file.path), campaignFolder);
  const note = await files.make(`${sessionsFolder}/Session ${number}.md`, "");
  const title = session.title.trim();
  await actions.changeProperties(note, (properties: Record<string, unknown>) => {
    properties.played = session.played;
    if (title !== "") properties.title = title;
  });
  return note;
}
