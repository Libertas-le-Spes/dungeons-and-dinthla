import type { TFile } from "obsidian";
import { NoteEditor, PartlyWritten, type EditorFiles } from "../../campaign/writing/note-editor";
import { sessionLabelOf } from "../../campaign/paths/session-file";
import { linkedFactsOf } from "../../notes/character-facts";
import { messageOf } from "../../views/dialogs/message-of";
import { factLine, refusalForValue, withOverrides, type OverrideChange } from "./character-entry";
import { writeOverrides } from "./character-files";
import { NOT_KNOWN, type SheetValue, type StatedValue, type ValueState } from "../reading/character-sheet";
import type { FencedFiles } from "../../fence/fenced-files";

export interface ValueChoice {
  state: ValueState;
  value: string;
}

export interface SheetWrite {
  override: OverrideChange | null;
  sessionFact: string | null;
}

export interface SheetTarget {
  files: EditorFiles & Pick<FencedFiles, "process">;
  file: TFile;
  sessionPath(): string;
  linktextFrom(sessionPath: string): string;
  pathOfLink(linktext: string, sourcePath: string): string | null;
}

export const NO_VALUE = "Type a value first, or choose Not known yet.";
export const QUESTION_MARK = "A value of ? means not known yet. Choose Not known yet instead.";

export function nothingCarried(label: string): string {
  return `No campaign this character was carried from gives the ${label.toLowerCase()}, so nothing was written.`;
}

export function learnedHereWins(label: string): string {
  return `The ${label.toLowerCase()} was learned in this campaign, which wins over a carried value, so nothing was written.`;
}

export function markedNotKnownHere(label: string): string {
  return `A ? line in this campaign marks the ${label.toLowerCase()} not known, and it wins over the carried value until a later line states it, so nothing was written.`;
}

export function carriedDiffers(label: string, campaign: string): string {
  return `The carried ${label.toLowerCase()} comes from ${campaign}. Change it there, or choose Override.`;
}

export function linksElsewhere(linktext: string, sessionPath: string): string {
  return `[[${linktext}]] wouldn't point to this character from ${sessionLabelOf(sessionPath)}, so nothing was written.`;
}

function overrideChange(value: SheetValue, after: string): OverrideChange | null {
  let before = "";
  if (value.override !== null) before = value.override.value;
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
  return { override: overrideChange(value, ""), sessionFact };
}

function unknownWrite(value: SheetValue): SheetWrite {
  const shownBeneath = underneath(value);
  let sessionFact: string | null = null;
  if (shownBeneath !== null && shownBeneath.value !== NOT_KNOWN) sessionFact = factLine(value.name, NOT_KNOWN);
  return { override: overrideChange(value, ""), sessionFact };
}

function carriedWrite(value: SheetValue, written: string): SheetWrite {
  if (value.carried === null || value.carriedCampaign === null) throw new Error(nothingCarried(value.label));
  if (value.learned !== null && value.learned.value === NOT_KNOWN) throw new Error(markedNotKnownHere(value.label));
  if (value.learned !== null) throw new Error(learnedHereWins(value.label));
  if (written !== "" && written !== value.carried.value) throw new Error(carriedDiffers(value.label, value.carriedCampaign));
  return { override: overrideChange(value, ""), sessionFact: null };
}

export function sheetWriteOf(value: SheetValue, choice: ValueChoice): SheetWrite {
  const written = choice.value.trim();
  if (choice.state === "learned") return learnedWrite(value, written);
  if (choice.state === "unknown") return unknownWrite(value);
  if (choice.state === "carried") return carriedWrite(value, written);
  refuseUnlessWritable(value, written);
  return { override: overrideChange(value, written), sessionFact: null };
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
  const { files, file } = target;
  const override = write.override;
  const fact = write.sessionFact;
  if (override === null && fact === null) return false;
  if (override !== null) withOverrides(await files.read(file), file.path, [override]);
  if (fact !== null) {
    const sessionPath = target.sessionPath();
    await new NoteEditor(files).appendShown(sessionPath, [sessionLineOf(target, sessionPath, fact)]);
  }
  if (override === null) return true;
  try {
    await writeOverrides(files, file, (text) => withOverrides(text, file.path, [override]));
  } catch (error) {
    if (fact === null) throw error;
    throw new PartlyWritten(`The line was added to the session, but ${file.basename}'s note was left: ${messageOf(error)}`);
  }
  return true;
}
