import type { TFile } from "obsidian";
import type { ImportWriter } from "../../note/writing/import-writer";
import { UPDATE_TITLE } from "../import-words";
import { ExistingNoteTarget } from "../targets/existing-note-target";
import type { ImportTarget } from "../targets/import-target";

export class UpdateFlow {
  readonly title = UPDATE_TITLE;

  constructor(
    private readonly writer: ImportWriter,
    private readonly file: TFile,
  ) {}

  targetsFor(): ImportTarget[] {
    return [new ExistingNoteTarget(this.writer, this.file)];
  }
}
