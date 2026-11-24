import type { LeavingFiles } from "./switch-plan";
import type { NoteRef } from "../../../host/notes/note-ref";

export class AskedNote {
  private constructor(
    readonly file: NoteRef,
    readonly path: string,
  ) {}

  static of(file: NoteRef): AskedNote {
    return new AskedNote(file, file.path);
  }

  isStillThere(files: LeavingFiles): boolean {
    return files.note(this.path) === this.file;
  }
}
