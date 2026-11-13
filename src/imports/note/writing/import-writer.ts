import type { TFile } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { refusalForFileName } from "../../../names/file-name";
import { nameKeyOf } from "../../../names/name-key";
import { importChangesOf, type ImportChanges, type TypedText } from "../changes/import-changes";
import { refuseUnlessCharacterNote } from "./guarding/in-characters-folder";
import { importedNoteText } from "./rewriting/imported-note";
import type { NoteFiles } from "./note-files";
import { checkedNewNoteText, checkedTextOf, writeWhenUnchangedSinceRead } from "./process-or-refuse";
import { nameTaken } from "./guarding/refusals";
import { Refusal } from "../../../beyond/shape/refusal";

export class ImportWriter {
  constructor(
    private readonly files: NoteFiles,
    private readonly charactersFolder: string,
  ) {}

  async changesFor(file: TFile, sheet: PrintedSheet, today: string): Promise<ImportChanges> {
    refuseUnlessCharacterNote(file.path, this.charactersFolder);
    const before = await this.files.read(file);
    return importChangesOf(before, importedNoteText(before, sheet, today));
  }

  async update(file: TFile, sheet: PrintedSheet, today: string, shown: readonly TypedText[]): Promise<void> {
    refuseUnlessCharacterNote(file.path, this.charactersFolder);
    const before = await this.files.read(file);
    const after = checkedTextOf(before, sheet, today, shown);
    if (after === before) return;
    await writeWhenUnchangedSinceRead(this.files, file, before, after);
  }

  async create(sheet: PrintedSheet, today: string): Promise<TFile> {
    const name = sheet.character.name.text;
    const path = `${this.charactersFolder}/${name}.md`;
    this.refuseUnlessNew(name, path);
    const text = checkedNewNoteText(sheet, today);
    if (this.files.getFolderByPath(this.charactersFolder) === null) await this.files.createFolder(this.charactersFolder);
    return this.files.create(path, text);
  }

  private refuseUnlessNew(name: string, path: string): void {
    const refusal = refusalForFileName(name);
    if (refusal !== null) throw new Refusal(refusal);
    const wanted = nameKeyOf(path);
    for (const file of this.files.getFiles()) {
      if (nameKeyOf(file.path) === wanted) throw nameTaken(file.basename);
    }
  }
}
