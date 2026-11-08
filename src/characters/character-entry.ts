import { CHANGED_IN_NOTE, PROPERTIES_WOULD_CHANGE } from "../campaign/note-editor";
import { keepsProperties } from "../campaign/session-file";
import { withoutBullet } from "../notes/bullet";
import { factsOf } from "../notes/character-facts";
import { appendLines, dropLine, rewriteLine } from "../notes/note-lines";
import { overrideFacts, sheetNameOf, sheetValuesOf, type SourcedFact } from "./sheet-values";

export interface CharacterEntry {
  name: string;
  type: string;
  subtitle: string;
  speed: string;
}

type EntryFact = "type" | "subtitle" | "speed";

export const ENTRY_FIELDS: { fact: EntryFact; label: string }[] = [
  { fact: "type", label: "Type line" },
  { fact: "subtitle", label: "Subtitle" },
  { fact: "speed", label: "Speed" },
];

export function blankEntry(): CharacterEntry {
  return { name: "", type: "", subtitle: "", speed: "" };
}

export function entryOf(name: string, path: string, ownNote: string): CharacterEntry {
  const values = sheetValuesOf([], overrideFacts(ownNote, path));
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

export function sharedLine(label: string): string {
  return `The ${label.toLowerCase()} is on a line of the note with other values, so it can't be cleared here. Change it in the note.`;
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

function lastStated(text: string, path: string, fact: EntryFact): SourcedFact | undefined {
  const stated = overrideFacts(text, path).filter((candidate) => sheetNameOf(candidate.name) === fact);
  return stated[stated.length - 1];
}

function withValue(text: string, path: string, fact: EntryFact, label: string, value: string): string {
  const stated = lastStated(text, path, fact);
  if (stated === undefined) return appendLines(text, [factLine(fact, value)]);
  const target = { line: stated.source.line, matches: () => true };
  const written = text.split("\n")[stated.source.line]!;
  const alone = factsOf(withoutBullet(written)).length === 1;
  if (alone && value === "") return dropLine(text, target)!;
  if (alone) return rewriteLine(text, target, factLine(fact, value))!;
  if (value === "") throw new Error(sharedLine(label));
  return appendLines(text, [factLine(fact, value)]);
}

export function withEntryValues(text: string, path: string, before: CharacterEntry, after: CharacterEntry): string {
  const current = entryOf(before.name, path, text);
  let changed = text;
  for (const { fact, label } of ENTRY_FIELDS) {
    if (after[fact] === before[fact]) continue;
    if (current[fact] !== before[fact]) throw new Error(CHANGED_IN_NOTE);
    changed = withValue(changed, path, fact, label, after[fact]);
  }
  if (!keepsProperties(text, changed)) throw new Error(PROPERTIES_WOULD_CHANGE);
  return changed;
}
