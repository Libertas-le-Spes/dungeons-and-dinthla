import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { changesNothing, type ImportChanges, type TypedText } from "../../note/changes/import-changes";
import { changeTrees } from "../review/change-list";
import { Div } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { ImportWriter } from "../../note/writing/import-writer";
import { existingNoteWords, UPDATE_BUTTON } from "../import-words";
import type { ImportTarget } from "./import-target";
import type { NoteRef } from "../../../host/notes/note-ref";

export class ExistingNoteTarget implements ImportTarget {
  readonly buttonWords = UPDATE_BUTTON;
  readonly choiceWords: string;

  constructor(
    private readonly writer: ImportWriter,
    private readonly file: NoteRef,
  ) {
    this.choiceWords = existingNoteWords(file.basename);
  }

  changesFor(sheet: PrintedSheet, today: string): Promise<ImportChanges | null> {
    return this.writer.changesFor(this.file, sheet, today);
  }

  hasWork(changes: ImportChanges | null): boolean {
    if (changes === null) return false;
    return !changesNothing(changes);
  }

  planOf(changes: ImportChanges | null): ViewElement[] {
    if (changes === null) return [];
    return [new Div({ cls: ["dd-import-changes"] }, changeTrees(changes))];
  }

  async bringIn(sheet: PrintedSheet, today: string, changes: ImportChanges | null): Promise<string> {
    let shown: readonly TypedText[] = [];
    if (changes !== null) shown = changes.typed;
    await this.writer.update(this.file, sheet, today, shown);
    return this.file.path;
  }
}
