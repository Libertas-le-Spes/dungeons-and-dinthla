import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { notesLikeName } from "../../note/matching/note-match";
import type { ImportWriter } from "../../note/writing/import-writer";
import { IMPORT_TITLE } from "../import-words";
import { ExistingNoteTarget } from "../targets/existing-note-target";
import type { ImportTarget } from "../targets/import-target";
import type { FlowStart, ImportFlow } from "./import-flow";
import { NewNoteTarget } from "../targets/new-note-target";
import type { NoteRef } from "../../../host/notes/note-ref";

export class NewImportFlow implements ImportFlow {
  readonly title = IMPORT_TITLE;

  constructor(
    private readonly writer: ImportWriter,
    private readonly charactersFolder: string,
    private readonly notes: () => readonly NoteRef[],
  ) {}

  start(steps: FlowStart): void {
    steps.chooseSource();
  }

  refusalFor(): string | null {
    return null;
  }

  targetsFor(sheet: PrintedSheet): ImportTarget[] {
    const name = sheet.character.name.text;
    const targets: ImportTarget[] = [];
    for (const file of notesLikeName(name, this.notesDirectlyInFolder())) targets.push(new ExistingNoteTarget(this.writer, file));
    targets.push(new NewNoteTarget(this.writer, name));
    return targets;
  }

  private notesDirectlyInFolder(): NoteRef[] {
    const direct: NoteRef[] = [];
    for (const file of this.notes()) {
      if (file.path === `${this.charactersFolder}/${file.basename}.md`) direct.push(file);
    }
    return direct;
  }
}
