import type { TFile, Vault } from "obsidian";
import { NoteEditor, PartlyWritten, type EditorVault } from "../campaign/note-editor";
import { sessionLabelOf } from "../campaign/session-file";
import { latestNumberIsShared, latestSession, SESSIONS_SHARE_A_NUMBER } from "../campaign/session-to-write";
import { linkedFactsOf } from "../notes/character-facts";
import { messageOf } from "../views/message-of";
import { factLine, refusalForValue, withOwnValues, type OwnValueChange } from "./character-entry";
import { writeOwnNote } from "./character-files";
import { NOT_KNOWN, type SheetValue, type StatedValue, type ValueState } from "./character-sheet";

export interface ValueChoice {
  state: ValueState;
  value: string;
}

export interface SheetWrite {
  own: OwnValueChange | null;
  sessionFact: string | null;
}

export interface SheetTarget {
  vault: EditorVault & Pick<Vault, "process">;
  file: TFile;
  sessionPath(): string;
  linktextFrom(sessionPath: string): string;
  pathOfLink(linktext: string, sourcePath: string): string | null;
}

export const NO_VALUE = "Type a value first, or choose Not known yet.";
export const QUESTION_MARK = "A value of ? means not known yet. Choose Not known yet instead.";
export const NO_SESSION = "There's no session to write in yet. Start one first.";

export function nothingCarried(label: string): string {
  return `No campaign this character was carried from gives the ${label.toLowerCase()}, so nothing was written.`;
}

export function learnedHereWins(label: string): string {
  return `The ${label.toLowerCase()} was learned in this campaign, which wins over a carried value, so nothing was written.`;
}

export function carriedDiffers(label: string, campaign: string): string {
  return `The carried ${label.toLowerCase()} comes from ${campaign}. Change it there, or choose Override.`;
}

export function linksElsewhere(linktext: string, sessionPath: string): string {
  return `[[${linktext}]] wouldn't point to this character from ${sessionLabelOf(sessionPath)}, so nothing was written.`;
}

export function sessionToWrite(campaignFolder: string, paths: string[]): string {
  if (latestNumberIsShared(campaignFolder, paths)) throw new Error(SESSIONS_SHARE_A_NUMBER);
  const latest = latestSession(campaignFolder, paths);
  if (latest === null) throw new Error(NO_SESSION);
  return latest;
}

function ownChange(value: SheetValue, after: string): OwnValueChange | null {
  let before = "";
  if (value.own !== null) before = value.own.value;
  if (before === after) return null;
  return { name: value.name, label: value.label, before, after };
}

function refuseUnlessWritable(value: SheetValue, written: string): void {
  if (written === "") throw new Error(NO_VALUE);
  if (written === NOT_KNOWN) throw new Error(QUESTION_MARK);
  const refusal = refusalForValue(value.name, value.label, written);
  if (refusal !== null) throw new Error(refusal);
}

function underneath(value: SheetValue): StatedValue | null {
  if (value.learned !== null) return value.learned;
  return value.carried;
}

function learnedWrite(value: SheetValue, written: string): SheetWrite {
  refuseUnlessWritable(value, written);
  let sessionFact: string | null = factLine(value.name, written);
  if (value.learned !== null && value.learned.value === written) sessionFact = null;
  return { own: ownChange(value, ""), sessionFact };
}

function unknownWrite(value: SheetValue): SheetWrite {
  const shownBeneath = underneath(value);
  let after = "";
  if (shownBeneath !== null && shownBeneath.value !== NOT_KNOWN) after = NOT_KNOWN;
  return { own: ownChange(value, after), sessionFact: null };
}

function carriedWrite(value: SheetValue, written: string): SheetWrite {
  if (value.carried === null || value.carriedFrom === null) throw new Error(nothingCarried(value.label));
  if (value.learned !== null) throw new Error(learnedHereWins(value.label));
  if (written !== "" && written !== value.carried.value) throw new Error(carriedDiffers(value.label, value.carriedFrom));
  return { own: ownChange(value, ""), sessionFact: null };
}

export function sheetWriteOf(value: SheetValue, choice: ValueChoice): SheetWrite {
  const written = choice.value.trim();
  if (choice.state === "learned") return learnedWrite(value, written);
  if (choice.state === "unknown") return unknownWrite(value);
  if (choice.state === "carried") return carriedWrite(value, written);
  refuseUnlessWritable(value, written);
  return { own: ownChange(value, written), sessionFact: null };
}

function sessionLineOf(target: SheetTarget, sessionPath: string, fact: string): string {
  const linktext = target.linktextFrom(sessionPath);
  const line = `[[${linktext}]] ${fact}`;
  const linked = linkedFactsOf(line);
  if (linked === null || target.pathOfLink(linked.target, sessionPath) !== target.file.path) {
    throw new Error(linksElsewhere(linktext, sessionPath));
  }
  return line;
}

export async function writeSheetValue(target: SheetTarget, write: SheetWrite): Promise<boolean> {
  const { vault, file } = target;
  const own = write.own;
  const fact = write.sessionFact;
  if (own === null && fact === null) return false;
  if (own !== null) withOwnValues(await vault.read(file), file.path, [own]);
  if (fact !== null) {
    const sessionPath = target.sessionPath();
    await new NoteEditor(vault).appendShown(sessionPath, [sessionLineOf(target, sessionPath, fact)]);
  }
  if (own === null) return true;
  try {
    await writeOwnNote(vault, file, (text) => withOwnValues(text, file.path, [own]));
  } catch (error) {
    if (fact === null) throw error;
    throw new PartlyWritten(`The line was added to the session, but ${file.basename}'s note was left: ${messageOf(error)}`);
  }
  return true;
}
