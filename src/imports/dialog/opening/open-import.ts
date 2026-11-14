import type { App, TFile } from "obsidian";
import { ImportWriter } from "../../note/writing/import-writer";
import type { NoteFiles } from "../../note/writing/note-files";
import { NewImportFlow } from "../flows/new-import-flow";
import { UpdateFlow } from "../flows/update-flow";
import { ImportModal, type ImportClosed } from "../import-modal";
import type { OnlineSource } from "../online/online-source";
import { dayOf } from "../today";

export interface ImportPlace {
  readonly app: App;
  readonly files: NoteFiles;
  readonly charactersFolder: string;
  readonly campaignFolder: string;
  readonly online: OnlineSource;
  notes(): readonly TFile[];
}

export function openImport(place: ImportPlace, closed: ImportClosed): void {
  const writer = new ImportWriter(place.files, place.charactersFolder, place.campaignFolder);
  new ImportModal(place.app, { flow: new NewImportFlow(writer, place.charactersFolder, place.notes.bind(place)), today: dayOf(new Date()), online: place.online, onClosed: closed }).open();
}

export function openUpdate(place: ImportPlace, file: TFile, closed: ImportClosed): void {
  const writer = new ImportWriter(place.files, place.charactersFolder, place.campaignFolder);
  new ImportModal(place.app, { flow: new UpdateFlow(writer, file), today: dayOf(new Date()), online: place.online, onClosed: closed }).open();
}
