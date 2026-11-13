import type { TFile } from "obsidian";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import { refusalForFileName } from "../../../names/file-name";
import { nameKeyOf } from "../../../names/name-key";
import { importChangesOf, type ImportChanges } from "../changes/import-changes";
import { refuseUnlessCharacterNote } from "./in-characters-folder";
import { importedNoteText } from "./imported-note";
import type { NoteFiles } from "./note-files";
import { checkedNewNoteText, writeCheckedImport } from "./process-or-refuse";
import { badName, nameTaken } from "./refusals";

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

  async update(file: TFile, sheet: PrintedSheet, today: string): Promise<void> {
    refuseUnlessCharacterNote(file.path, this.charactersFolder);
    await writeCheckedImport(this.files, file, sheet, today);
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
    if (refusal !== null) throw badName(refusal);
    const wanted = nameKeyOf(path);
    for (const file of this.files.getFiles()) {
      if (nameKeyOf(file.path) === wanted) throw nameTaken(file.basename);
    }
  }
}
