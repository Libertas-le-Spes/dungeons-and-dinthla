import { hasLeftPlay } from "../../layout/standing";
import { standingOf } from "../properties/property-value";
import { textOfNote } from "../switching/read-note";
import type { LeavingFiles } from "../switching/switch-plan";
import { NOTE_UNREAD } from "../switching/switch-words";
import type { NoteRef } from "../../../host/notes/note-ref";

export interface AskWhen {
  wants(files: LeavingFiles, file: NoteRef): Promise<boolean>;
}

export class AskAlways implements AskWhen {
  async wants(): Promise<boolean> {
    return true;
  }
}

export class AskWhenLeftPlay implements AskWhen {
  async wants(files: LeavingFiles, file: NoteRef): Promise<boolean> {
    return hasLeftPlay(standingOf(await textOfNote(files, file, NOTE_UNREAD)));
  }
}
