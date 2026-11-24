import { Refusal } from "../../../beyond/shape/refusal";
import type { LeavingFiles } from "./switch-plan";
import type { NoteRef } from "../../../host/notes/note-ref";

export async function textOfNote(files: LeavingFiles, file: NoteRef, unreadWords: string): Promise<string> {
  try {
    return await files.read(file);
  } catch {
    throw new Refusal(unreadWords);
  }
}
