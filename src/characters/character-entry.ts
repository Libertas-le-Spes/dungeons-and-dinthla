import { CHANGED_IN_NOTE, PROPERTIES_WOULD_CHANGE } from "../campaign/note-editor";
import { keepsProperties } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import { factsOf, type CharacterFact } from "../notes/character-facts";
import { hiddenLines } from "../notes/hidden-lines";
import { appendLines, removeLines, rewriteLine } from "../notes/note-lines";
import { overrideFacts, sheetNameOf, sheetValuesOf, type SourcedFact } from "./sheet-values";

export interface CharacterEntry {
  name: string;
  type: string;
  subtitle: string;
  speed: string;
}

export type EntryFact = "type" | "subtitle" | "speed";

export const ENTRY_FIELDS: { fact: EntryFact; label: string }[] = [
  { fact: "type", label: "Type line" },
  { fact: "subtitle", label: "Subtitle" },
  { fact: "speed", label: "Speed" },
];

export function blankEntry(): CharacterEntry {
  return { name: "", type: "", subtitle: "", speed: "" };
}

export type Learned = Map<EntryFact, string>;

export function learnedOf(facts: CharacterFact[]): Learned {
  const values = sheetValuesOf(facts, []);
  const learned: Learned = new Map();
  for (const { fact } of ENTRY_FIELDS) {
    const value = values.get(fact);
    if (value !== undefined) learned.set(fact, value);
  }
  return learned;
}

export function entryOf(name: string, path: string, ownNote: string): CharacterEntry {
  const values = learnedOf(overrideFacts(ownNote, path));
  const entry = { ...blankEntry(), name };
  for (const { fact } of ENTRY_FIELDS) {
    const value = values.get(fact);
    if (value !== undefined) entry[fact] = value;
  }
  return entry;
}

export function trimmedEntry(entry: CharacterEntry): CharacterEntry {
  return { name: entry.name.trim(), type: entry.type.trim(), subtitle: entry.subtitle.trim(), speed: entry.speed.trim() };
}

function factLine(fact: EntryFact, value: string): string {
  return `${fact}: ${value}`;
}

export function readsBackDifferently(label: string): string {
  return `The ${label.toLowerCase()} would read back differently: a comma followed by a word and a colon starts another value.`;
}

export function stillReads(label: string, value: string): string {
  return `After that change the note would still give the ${label.toLowerCase()} as ${value}, from a line the dialog can't change, so nothing was written. Change it in the note.`;
}

export function blockIdOn(label: string): string {
  return `The ${label.toLowerCase()}'s line ends in a block id, which links can point to, so it was left. Change it in the note.`;
}

export function refusalForValues(entry: CharacterEntry): string | null {
  for (const { fact, label } of ENTRY_FIELDS) {
    const value = entry[fact];
    if (value === "") continue;
    if (factsOf(factLine(fact, value))[0]!.value !== value) return readsBackDifferently(label);
  }
  return null;
}

export function newCharacterText(entry: CharacterEntry): string {
  const lines = ENTRY_FIELDS.filter(({ fact }) => entry[fact] !== "").map(({ fact }) => factLine(fact, entry[fact]));
  return appendLines("", lines);
}

export function valuesChanged(before: CharacterEntry, after: CharacterEntry): boolean {
  return ENTRY_FIELDS.some(({ fact }) => before[fact] !== after[fact]);
}

const BLOCK_ID = /\s\^[A-Za-z0-9-]+\s*$/;

interface StatingLine {
  line: number;
  alone: boolean;
  hidden: boolean;
}

function linesStating(text: string, path: string, fact: EntryFact): StatingLine[] {
  const lines = text.split("\n");
  const hidden = hiddenLines(text);
  return overrideFacts(text, path)
    .filter((candidate) => sheetNameOf(candidate.name) === fact)
    .map(({ source }) => ({
      line: source.line,
      alone: factsOf(withoutBullet(lines[source.line]!)).length === 1,
      hidden: hidden.has(source.line),
    }));
}

function changeable(text: string, line: number, label: string): { line: number; matches: () => boolean } {
  if (BLOCK_ID.test(text.split("\n")[line]!)) throw new Error(blockIdOn(label));
  return { line, matches: () => true };
}

function withValue(text: string, path: string, fact: EntryFact, label: string, value: string): string {
  const stating = linesStating(text, path, fact);
  if (value === "") {
    const alone = stating.filter((candidate) => candidate.alone && !candidate.hidden);
    return removeLines(text, alone.map(({ line }) => changeable(text, line, label))).text;
  }
  const last = stating[stating.length - 1];
  if (last === undefined || !last.alone || last.hidden) return appendLines(text, [factLine(fact, value)]);
  return rewriteLine(text, changeable(text, last.line, label), factLine(fact, value))!;
}

function refuseUnlessWritten(changed: string, path: string, before: CharacterEntry, after: CharacterEntry): void {
  const written = entryOf(after.name, path, changed);
  for (const { fact, label } of ENTRY_FIELDS) {
    if (after[fact] !== before[fact] && written[fact] !== after[fact]) throw new Error(stillReads(label, written[fact]));
  }
}

export function withEntryValues(text: string, path: string, before: CharacterEntry, after: CharacterEntry): string {
  const current = entryOf(before.name, path, text);
  let changed = text;
  for (const { fact, label } of ENTRY_FIELDS) {
    if (after[fact] === before[fact]) continue;
    if (current[fact] !== before[fact]) throw new Error(CHANGED_IN_NOTE);
    changed = withValue(changed, path, fact, label, after[fact]);
  }
  refuseUnlessWritten(changed, path, before, after);
  if (!keepsProperties(text, changed)) throw new Error(PROPERTIES_WOULD_CHANGE);
  return changed;
}
