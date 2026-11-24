import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { refusalForFileName } from "../../../names/file-name";
import { nameKeyOf } from "../../../names/name-key";
import { importChangesOf, type ImportChanges, type TypedText } from "../changes/import-changes";
import { refuseUnlessCharacterNote } from "./guarding/in-characters-folder";
import type { ImportStamp } from "../properties/import-stamp";
import { importedNoteText } from "./rewriting/imported-note";
import type { NoteFiles } from "./note-files";
import { checkedNewNoteText, checkedTextOf, writeWhenUnchangedSinceRead } from "./checked-note-text";
import { nameTaken } from "./guarding/refusals";
import { Refusal } from "../../../beyond/shape/refusal";
import { fallenNoteOf, leftPlayWords } from "../../../campaign/paths/fallen-notes";
import { highestNumber } from "../../../campaign/paths/session-to-write";
import type { NoteRef } from "../../../host/notes/note-ref";

export class ImportWriter {
  constructor(
    private readonly files: NoteFiles,
    private readonly charactersFolder: string,
    private readonly campaignFolder: string,
  ) {}

  async changesFor(file: NoteRef, sheet: PrintedSheet, today: string): Promise<ImportChanges> {
    refuseUnlessCharacterNote(file.path, this.charactersFolder);
    const before = await this.files.read(file);
    return importChangesOf(before, importedNoteText({ current: before, sheet, stamp: this.stampOf(today) }));
  }

  async update(file: NoteRef, sheet: PrintedSheet, today: string, shown: readonly TypedText[]): Promise<void> {
    refuseUnlessCharacterNote(file.path, this.charactersFolder);
    const before = await this.files.read(file);
    const after = checkedTextOf({ before, sheet, stamp: this.stampOf(today), shown });
    if (after === before) return;
    await writeWhenUnchangedSinceRead(this.files, file, before, after);
  }

  refuseUnlessCreatable(sheet: PrintedSheet, today: string): void {
    this.refuseUnlessNew(sheet.character.name.text);
    checkedNewNoteText(sheet, this.stampOf(today));
  }

  async create(sheet: PrintedSheet, today: string): Promise<NoteRef> {
    const name = sheet.character.name.text;
    const path = this.newNotePathOf(name);
    this.refuseUnlessNew(name);
    const text = checkedNewNoteText(sheet, this.stampOf(today));
    if (!this.files.hasFolder(this.charactersFolder)) await this.files.makeFolder(this.charactersFolder);
    return this.files.make(path, text);
  }

  private stampOf(today: string): ImportStamp {
    const paths = this.files.files().map((file) => file.path);
    return { today, session: Math.max(highestNumber(this.campaignFolder, paths), 0) };
  }

  private newNotePathOf(name: string): string {
    return `${this.charactersFolder}/${name}.md`;
  }

  private refuseUnlessNew(name: string): void {
    const refusal = refusalForFileName(name);
    if (refusal !== null) throw new Refusal(refusal);
    const wanted = nameKeyOf(this.newNotePathOf(name));
    const files = this.files.files();
    for (const file of files) {
      if (nameKeyOf(file.path) === wanted) throw nameTaken(file.basename);
    }
    if (fallenNoteOf(files, this.campaignFolder, name) !== null) throw new Refusal(leftPlayWords(name));
  }
}
