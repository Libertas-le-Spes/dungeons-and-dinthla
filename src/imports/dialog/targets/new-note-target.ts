import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { ImportChanges } from "../../note/changes/import-changes";
import type { ImportWriter } from "../../note/writing/import-writer";
import { IMPORT_BUTTON, newNoteWords } from "../import-words";
import type { ImportTarget } from "./import-target";

export class NewNoteTarget implements ImportTarget {
  readonly buttonWords = IMPORT_BUTTON;
  readonly choiceWords: string;

  constructor(
    private readonly writer: ImportWriter,
    readonly noteName: string,
  ) {
    this.choiceWords = newNoteWords(noteName);
  }

  async changesFor(): Promise<ImportChanges | null> {
    return null;
  }

  hasWork(): boolean {
    return true;
  }

  drawPlan(parent: HTMLElement): void {
    parent.createEl("p", { cls: "dd-where", text: newNoteWords(this.noteName) });
  }

  async bringIn(sheet: PrintedSheet, today: string): Promise<string> {
    const file = await this.writer.create(sheet, today);
    return file.path;
  }
}
