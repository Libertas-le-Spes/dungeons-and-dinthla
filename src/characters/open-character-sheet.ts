import { Notice, type App, type TFile } from "obsidian";
import type { Source } from "../campaign/campaign";
import { CHANGED_IN_NOTE } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { messageOf } from "../views/message-of";
import { sameName } from "./character-entry";
import type { SheetValue, StatedValue } from "./character-sheet";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "./read-character-sheet";
import type { SheetNotes } from "./sheet-notes";
import { SheetValueModal } from "./sheet-value-modal";
import { NO_SESSION, sessionToWrite, sheetWriteOf, writeSheetValue, type ValueChoice } from "./sheet-value-writer";

export async function openCharacterSheet(app: App, path: string): Promise<void> {
  const file = app.vault.getFileByPath(path);
  if (file === null) return;
  await app.workspace.getLeaf(false).openFile(file, { active: true });
}

function sameStated(first: StatedValue | null, second: StatedValue | null): boolean {
  if (first === null || second === null) return first === second;
  return first.value === second.value && first.source.path === second.source.path && first.source.line === second.source.line;
}

export function sameSheetValue(first: SheetValue, second: SheetValue): boolean {
  return sameStated(first.override, second.override) && sameStated(first.learned, second.learned) && sameStated(first.carried, second.carried);
}

function valueIn(read: ReadSheet, name: string): SheetValue | undefined {
  return [...read.sheet.abilities, ...read.sheet.values].find((value) => sameName(value.name, name));
}

function sessionPathIn(read: ReadSheet): string {
  if (read.campaignFolder === null) throw new Error(NO_SESSION);
  return sessionToWrite(read.campaignFolder, read.sessions.map((session) => session.path));
}

function sessionLabelIn(read: ReadSheet): string | null {
  try {
    return sessionLabelOf(sessionPathIn(read));
  } catch {
    return null;
  }
}

export async function saveSheetValue(
  app: App,
  store: SheetStore,
  notes: SheetNotes,
  file: TFile,
  opened: SheetValue,
  choice: ValueChoice,
): Promise<boolean> {
  const read = await readCharacterSheet(file, store, notes);
  const current = valueIn(read, opened.name);
  if (current === undefined || !sameSheetValue(current, opened)) throw new Error(CHANGED_IN_NOTE);
  return writeSheetValue(
    {
      vault: app.vault,
      file,
      sessionPath: () => sessionPathIn(read),
      linktextFrom: (sessionPath) => app.metadataCache.fileToLinktext(file, sessionPath, true),
      pathOfLink: (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath),
    },
    sheetWriteOf(current, choice),
  );
}

export async function chooseSheetValue(
  app: App,
  store: SheetStore,
  notes: SheetNotes,
  file: TFile,
  value: SheetValue,
  openSource: (source: Source) => void,
  onClosed: () => void,
): Promise<void> {
  let sessionLabel: string | null;
  try {
    sessionLabel = sessionLabelIn(await readCharacterSheet(file, store, notes));
  } catch (error) {
    new Notice(`Couldn't read ${file.basename}: ${messageOf(error)}`);
    return;
  }
  const dialog = {
    character: file.basename,
    notePath: file.path,
    value,
    sessionLabel,
    save: (choice: ValueChoice) => saveSheetValue(app, store, notes, file, value, choice),
    openSource,
  };
  new SheetValueModal(app, dialog, onClosed).open();
}
