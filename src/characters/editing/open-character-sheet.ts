import { Notice, type App, type TFile } from "obsidian";
import type { Source } from "../../campaign/record/campaign";
import { CHANGED_IN_NOTE } from "../../campaign/writing/note-editor";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { refuseIfSessionGone } from "../../campaign/paths/session-gone";
import { latestSessionWanted, NoSessionToWrite, sessionToWrite } from "../../campaign/paths/session-to-write";
import { messageOf } from "../../views/dialogs/message-of";
import { sameName } from "../reading/sheet-values";
import type { SheetValue, StatedValue } from "../reading/character-sheet";
import { readCharacterSheet, type ReadSheet, type SheetStore } from "../reading/read-character-sheet";
import type { SheetNotes } from "../reading/sheet-notes";
import { SheetValueModal } from "./sheet-value-modal";
import { sheetWriteOf, writeSheetValue, type ValueChoice } from "./sheet-value-writer";
import type { Gate } from "../../fence/gate/gatekeeper";

export const NO_SESSION = "There's no session to write in yet. Start one first.";

export async function openCharacterSheet(app: App, gate: Gate, path: string): Promise<void> {
  const file = gate.files.getFileByPath(path);
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
  if (read.campaignFolder === null) throw new NoSessionToWrite(NO_SESSION);
  const paths = read.sessions.map((session) => session.path);
  return sessionToWrite(read.campaignFolder, paths, latestSessionWanted(NO_SESSION));
}

function openedSessionIn(read: ReadSheet): string | null {
  try {
    return sessionPathIn(read);
  } catch (error) {
    if (!(error instanceof NoSessionToWrite)) throw error;
    return null;
  }
}

function sessionPathToSave(gate: Gate, read: ReadSheet, openedSession: string | null): string {
  if (openedSession === null) return sessionPathIn(read);
  refuseIfSessionGone(gate.files, openedSession);
  return openedSession;
}

function labelOf(sessionPath: string | null): string | null {
  if (sessionPath === null) return null;
  return sessionLabelOf(sessionPath);
}

export async function saveSheetValue(
  app: App,
  gate: Gate,
  store: SheetStore,
  notes: SheetNotes,
  file: TFile,
  opened: SheetValue,
  choice: ValueChoice,
  openedSession: string | null,
): Promise<boolean> {
  const read = await readCharacterSheet(file, store, notes);
  const current = valueIn(read, opened.name);
  if (current === undefined || !sameSheetValue(current, opened)) throw new Error(CHANGED_IN_NOTE);
  return writeSheetValue(
    {
      files: gate.files,
      file,
      sessionPath: () => sessionPathToSave(gate, read, openedSession),
      linktextFrom: (sessionPath) => gate.metadata.fileToLinktext(file, sessionPath, true),
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
  file: TFile,
  value: SheetValue,
  openSource: (source: Source) => void,
  onClosed: () => void,
): Promise<void> {
  let openedSession: string | null;
  try {
    openedSession = openedSessionIn(await readCharacterSheet(file, store, notes));
  } catch (error) {
    new Notice(`Couldn't read ${file.basename}: ${messageOf(error)}`);
    return;
  }
  const dialog = {
    character: file.basename,
    notePath: file.path,
    value,
    sessionLabel: labelOf(openedSession),
    save: (choice: ValueChoice) => saveSheetValue(app, gate, store, notes, file, value, choice, openedSession),
    openSource,
  };
  new SheetValueModal(app, dialog, onClosed).open();
}
