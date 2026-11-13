import type { TFile } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { notesLikeName } from "../../note/matching/note-match";
import type { ImportWriter } from "../../note/writing/import-writer";
import { IMPORT_TITLE } from "../import-words";
import { ExistingNoteTarget } from "../targets/existing-note-target";
import type { ImportTarget } from "../targets/import-target";
import { NewNoteTarget } from "../targets/new-note-target";

export class NewImportFlow {
  readonly title = IMPORT_TITLE;

  constructor(
    private readonly writer: ImportWriter,
    private readonly notes: () => readonly TFile[],
  ) {}

  targetsFor(sheet: PrintedSheet): ImportTarget[] {
    const name = sheet.character.name.text;
    const targets: ImportTarget[] = [];
    for (const file of notesLikeName(name, this.notes())) targets.push(new ExistingNoteTarget(this.writer, file));
    targets.push(new NewNoteTarget(this.writer, name));
    return targets;
  }
}
