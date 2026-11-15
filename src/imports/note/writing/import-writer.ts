import type { TFile } from "obsidian";
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
import { sessionNumberOf } from "../../../campaign/paths/session-file";

export class ImportWriter {
  constructor(
    private readonly files: NoteFiles,
    private readonly charactersFolder: string,
    private readonly campaignFolder: string,
  ) {}

  async changesFor(file: TFile, sheet: PrintedSheet, today: string): Promise<ImportChanges> {
    refuseUnlessCharacterNote(file.path, this.charactersFolder);
    const before = await this.files.read(file);
    return importChangesOf(before, importedNoteText({ current: before, sheet, stamp: this.stampOf(today) }));
  }

  async update(file: TFile, sheet: PrintedSheet, today: string, shown: readonly TypedText[]): Promise<void> {
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

  async create(sheet: PrintedSheet, today: string): Promise<TFile> {
    const name = sheet.character.name.text;
    const path = this.newNotePathOf(name);
    this.refuseUnlessNew(name);
    const text = checkedNewNoteText(sheet, this.stampOf(today));
    if (this.files.getFolderByPath(this.charactersFolder) === null) await this.files.createFolder(this.charactersFolder);
    return this.files.create(path, text);
  }

  private stampOf(today: string): ImportStamp {
    let session = 0;
    for (const file of this.files.getFiles()) {
      const number = sessionNumberOf(file.path, this.campaignFolder);
      if (number !== null && number > session) session = number;
    }
    return { today, session };
  }

  private newNotePathOf(name: string): string {
    return `${this.charactersFolder}/${name}.md`;
  }

  private refuseUnlessNew(name: string): void {
    const refusal = refusalForFileName(name);
    if (refusal !== null) throw new Refusal(refusal);
    const wanted = nameKeyOf(this.newNotePathOf(name));
    const files = this.files.getFiles();
    for (const file of files) {
      if (nameKeyOf(file.path) === wanted) throw nameTaken(file.basename);
    }
    if (fallenNoteOf(files, this.campaignFolder, name) !== null) throw new Refusal(leftPlayWords(name));
  }
}
