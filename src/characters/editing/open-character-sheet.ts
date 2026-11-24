import { Notice, type App, type TFile } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import { CHANGED_IN_NOTE } from "../../campaign/writing/note-editor";
import { OpenedSession } from "../../campaign/paths/session-gone";
import { NoSessionNamed } from "./no-session-named";
import { latestSessionWanted, NoSessionToWrite, sessionToWrite } from "../../campaign/paths/session-to-write";
import { messageOf } from "../../views/dialogs/message-of";
import { sameName } from "../reading/sheet-values";
import type { SheetValue, StatedValue } from "../reading/character-sheet";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "../reading/read-character-sheet";
import type { SheetNotes } from "../reading/sheet-notes";
import { SheetValueModal } from "./sheet-value-modal";
import { sheetWriteOf, writeSheetValue, type ValueChoice } from "./sheet-value-writer";
import type { Gate } from "../../fence/gate/gatekeeper";
import type { NoteRef } from "../../host/notes/note-ref";

export const NO_SESSION = "There's no session to write in yet. Start one first.";

function sameStated(first: StatedValue | null, second: StatedValue | null): boolean {
  if (first === null || second === null) return first === second;
  return first.value === second.value && first.source.path === second.source.path && first.source.line === second.source.line;
}

export function sameSheetValue(first: SheetValue, second: SheetValue): boolean {
  return sameStated(first.override, second.override) && sameStated(first.imported, second.imported) && sameStated(first.learned, second.learned) && sameStated(first.carried, second.carried);
}

function valueIn(read: ReadSheet, name: string): SheetValue | undefined {
  return [...read.sheet.abilities, ...read.sheet.values].find((value) => sameName(value.name, name));
}

function sessionPathIn(read: ReadSheet): string {
  if (read.campaignFolder === null) throw new NoSessionToWrite(NO_SESSION);
  const paths = read.sessions.map((session) => session.path);
  return sessionToWrite(read.campaignFolder, paths, latestSessionWanted(NO_SESSION));
}

export type SheetSession = OpenedSession | NoSessionNamed;

export const NOT_HELD = "the note isn't one the plugin may use.";

function vaultFileOf(gate: Gate, note: NoteRef): TFile {
  const file = gate.files.getFileByPath(note.path);
  if (file === null || file !== note) throw new Error(`Couldn't use ${note.path}: ${NOT_HELD}`);
  return file;
}

function openedSessionIn(gate: Gate, read: ReadSheet): SheetSession {
  try {
    return new OpenedSession(gate.files, sessionPathIn(read));
  } catch (error) {
    if (!(error instanceof NoSessionToWrite)) throw error;
    return new NoSessionNamed(error.message);
  }
}

function sessionPathToSave(openedSession: SheetSession): string {
  openedSession.refuseIfMoved();
  return openedSession.path;
}

export async function saveSheetValue(
  app: App,
  gate: Gate,
  store: SheetStore,
  notes: SheetNotes,
  file: NoteRef,
  opened: SheetValue,
  choice: ValueChoice,
  openedSession: SheetSession,
): Promise<boolean> {
  const vaultFile = vaultFileOf(gate, file);
  const read = await readCharacterSheet(file, store, notes);
  const current = valueIn(read, opened.name);
  if (current === undefined || !sameSheetValue(current, opened)) throw new Error(CHANGED_IN_NOTE);
  return writeSheetValue(
    {
      files: gate.files,
      file: vaultFile,
      sessionPath: () => sessionPathToSave(openedSession),
      linktextFrom: (sessionPath) => gate.metadata.fileToLinktext(vaultFile, sessionPath, true),
      pathOfLink: (linktext, sourcePath) => notes.pathOfLink(linktext, sourcePath),
    },
    sheetWriteOf(current, choice),
  );
}

export async function chooseSheetValue(
  app: App,
  gate: Gate,
  store: SheetStore,
  notes: SheetNotes,
  file: NoteRef,
  value: SheetValue,
  openSource: (source: Source) => void,
  onClosed: () => void,
): Promise<void> {
  let openedSession: SheetSession;
  try {
    openedSession = openedSessionIn(gate, await readCharacterSheet(file, store, notes));
  } catch (error) {
    new Notice(`Couldn't read ${file.basename}: ${messageOf(error)}`);
    return;
  }
  const dialog = {
    character: file.basename,
    notePath: file.path,
    value,
    sessionLabel: openedSession.label,
    save: (choice: ValueChoice) => saveSheetValue(app, gate, store, notes, file, value, choice, openedSession),
    openSource,
  };
  new SheetValueModal(app, dialog, onClosed).open();
}
