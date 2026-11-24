import type { App } from "obsidian";
import { ImportWriter } from "../../note/writing/import-writer";
import type { NoteFiles } from "../../note/writing/note-files";
import { NewImportFlow } from "../flows/new-import-flow";
import { UpdateFlow } from "../flows/update-flow";
import { ImportModal, type ImportClosed } from "../import-modal";
import type { OnlineSource } from "../online/online-source";
import { dayOf } from "../today";
import { keptBeyondNumberOf } from "../../note/reading/kept-beyond-number";
import type { NoteRef } from "../../../host/notes/note-ref";
import type { PropertiesSyntax } from "../../../campaign/paths/session-file";

export interface ImportPlace {
  readonly app: App;
  readonly files: NoteFiles;
  readonly charactersFolder: string;
  readonly campaignFolder: string;
  readonly online: OnlineSource;
  notes(): readonly NoteRef[];
}

export function openImport(place: ImportPlace, closed: ImportClosed, syntax: PropertiesSyntax): void {
  const writer = new ImportWriter(place.files, place.charactersFolder, place.campaignFolder, syntax);
  new ImportModal(place.app, { flow: new NewImportFlow(writer, place.charactersFolder, place.notes.bind(place)), today: dayOf(new Date()), online: place.online, onClosed: closed }).open();
}

async function keptNumberOf(place: ImportPlace, file: NoteRef, syntax: PropertiesSyntax): Promise<string | null> {
  try {
    return keptBeyondNumberOf(await place.files.read(file), syntax);
  } catch {
    return null;
  }
}

export async function openUpdate(place: ImportPlace, file: NoteRef, closed: ImportClosed, syntax: PropertiesSyntax): Promise<void> {
  const kept = await keptNumberOf(place, file, syntax);
  const writer = new ImportWriter(place.files, place.charactersFolder, place.campaignFolder, syntax);
  new ImportModal(place.app, { flow: new UpdateFlow(writer, file, kept), today: dayOf(new Date()), online: place.online, onClosed: closed }).open();
}
