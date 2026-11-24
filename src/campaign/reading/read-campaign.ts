import type { SessionNote } from "../record/campaign";
import { sessionNoteOf, sessionNumberOf, type PropertiesSyntax } from "../paths/session-file";
import type { NoteRef } from "../../host/notes/note-ref";
import type { NoteStore } from "../../host/notes/note-store";

export type CampaignFiles = Pick<NoteStore, "files" | "readKept" | "note">;

export async function readSession(file: NoteRef, number: number, files: CampaignFiles, syntax: PropertiesSyntax): Promise<SessionNote> {
  return sessionNoteOf(file.path, number, await files.readKept(file), syntax);
}

export async function readSessions(files: CampaignFiles, folder: string, syntax: PropertiesSyntax): Promise<SessionNote[]> {
  const reads: Promise<SessionNote>[] = [];
  for (const file of files.files()) {
    const number = sessionNumberOf(file.path, folder);
    if (number !== null) reads.push(readSession(file, number, files, syntax));
  }
  return Promise.all(reads);
}
