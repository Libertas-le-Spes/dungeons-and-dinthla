import type { TFile } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges, TypedText } from "../../note/changes/import-changes";
import type { ImportWriter } from "../../note/writing/import-writer";
import { UPDATE_BUTTON } from "../import-words";
import type { ImportTarget } from "./import-target";

export class ExistingNoteTarget implements ImportTarget {
  readonly buttonWords = UPDATE_BUTTON;
  readonly noteName: string;

  constructor(
    private readonly writer: ImportWriter,
    private readonly file: TFile,
  ) {
    this.noteName = file.basename;
  }

  changesFor(sheet: PrintedSheet, today: string): Promise<ImportChanges | null> {
    return this.writer.changesFor(this.file, sheet, today);
  }

  async write(sheet: PrintedSheet, today: string, changes: ImportChanges | null): Promise<string> {
    let shown: readonly TypedText[] = [];
    if (changes !== null) shown = changes.typed;
    await this.writer.update(this.file, sheet, today, shown);
    return this.file.path;
  }
}
