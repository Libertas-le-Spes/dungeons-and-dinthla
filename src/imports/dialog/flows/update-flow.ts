import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { notesLikeName } from "../../note/matching/note-match";
import type { ImportWriter } from "../../note/writing/import-writer";
import { notThisCharacter, UPDATE_TITLE } from "../import-words";
import { ExistingNoteTarget } from "../targets/existing-note-target";
import type { ImportTarget } from "../targets/import-target";
import type { FlowStart, ImportFlow } from "./import-flow";
import type { NoteRef } from "../../../host/notes/note-ref";

export class UpdateFlow implements ImportFlow {
  readonly title = UPDATE_TITLE;

  constructor(
    private readonly writer: ImportWriter,
    private readonly file: NoteRef,
    private readonly kept: string | null,
  ) {}

  start(steps: FlowStart): void {
    if (this.kept === null) steps.chooseSource();
    else steps.bringInKept(this.kept);
  }

  refusalFor(sheet: PrintedSheet): string | null {
    const name = sheet.character.name.text;
    if (notesLikeName(name, [this.file]).length > 0) return null;
    return notThisCharacter(name, this.file.basename);
  }

  targetsFor(): ImportTarget[] {
    return [new ExistingNoteTarget(this.writer, this.file)];
  }
}
