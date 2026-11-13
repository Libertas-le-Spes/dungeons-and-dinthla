import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges } from "../../note/changes/import-changes";
import type { ImportWriter } from "../../note/writing/import-writer";
import { IMPORT_BUTTON } from "../import-words";
import type { ImportTarget } from "./import-target";

export class NewNoteTarget implements ImportTarget {
  readonly buttonWords = IMPORT_BUTTON;

  constructor(
    private readonly writer: ImportWriter,
    readonly noteName: string,
  ) {}

  async changesFor(): Promise<ImportChanges | null> {
    return null;
  }

  async write(sheet: PrintedSheet, today: string): Promise<string> {
    const file = await this.writer.create(sheet, today);
    return file.path;
  }
}
