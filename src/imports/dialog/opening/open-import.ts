import type { App, TFile } from "obsidian";
import { ImportWriter } from "../../note/writing/import-writer";
import type { NoteFiles } from "../../note/writing/note-files";
import { NewImportFlow } from "../flows/new-import-flow";
import { UpdateFlow } from "../flows/update-flow";
import { ImportModal, type ImportClosed } from "../import-modal";
import { dayOf } from "../today";

export interface ImportPlace {
  readonly app: App;
  readonly files: NoteFiles;
  readonly charactersFolder: string;
  notes(): readonly TFile[];
}

export function openImport(place: ImportPlace, closed: ImportClosed): void {
  const writer = new ImportWriter(place.files, place.charactersFolder);
  new ImportModal(place.app, new NewImportFlow(writer, place.charactersFolder, place.notes.bind(place)), dayOf(new Date()), closed).open();
}

export function openUpdate(place: ImportPlace, file: TFile, closed: ImportClosed): void {
  const writer = new ImportWriter(place.files, place.charactersFolder);
  new ImportModal(place.app, new UpdateFlow(writer, file), dayOf(new Date()), closed).open();
}
