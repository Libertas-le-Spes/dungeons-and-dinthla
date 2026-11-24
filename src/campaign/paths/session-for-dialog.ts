import type { NoteStore } from "../../host/notes/note-store";
import type { Telling } from "../../host/showing/telling";
import { NoSessionToWrite, sessionToWrite, type SessionWanted } from "./session-to-write";

function pathsOf(files: Pick<NoteStore, "files">): string[] {
  const paths: string[] = [];
  for (const file of files.files()) paths.push(file.path);
  return paths;
}

export function sessionForDialog(files: Pick<NoteStore, "files">, telling: Pick<Telling, "say">, campaignFolder: string, wanted: SessionWanted): string | null {
  try {
    return sessionToWrite(campaignFolder, pathsOf(files), wanted);
  } catch (error) {
    if (!(error instanceof NoSessionToWrite)) throw error;
    telling.say(error.message);
    return null;
  }
}
