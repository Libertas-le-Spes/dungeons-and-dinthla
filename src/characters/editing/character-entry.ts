import { CHANGED_IN_NOTE, PROPERTIES_WOULD_CHANGE } from "../../campaign/writing/note-editor";
import { keepsProperties } from "../../campaign/paths/session-file";
import { withoutBullet } from "../../notes/parts/bullet";
import { factsOf, type CharacterFact } from "../../notes/reading/character-facts";
import { hiddenLines } from "../../notes/reading/hidden-lines";
import { appendLines, removeLines, rewriteLine } from "../../notes/writing/note-lines";
import { overrideFacts, sameName, sheetValuesOf } from "../reading/sheet-values";

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

export interface OverrideChange {
  name: string;
  label: string;
  before: string;
  after: string;
}

export function factLine(name: string, value: string): string {
  return `${name}: ${value}`;
}

export function overrideValueOf(text: string, path: string, name: string): string {
  let value = "";
  for (const fact of overrideFacts(text, path)) {
    if (sameName(fact.name, name)) value = fact.value;
  }
  return value;
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

const BLOCK_ID = /\s\^[A-Za-z0-9-]+\s*$/;

export const HIDING_WOULD_CHANGE =
  "That change would hide lines of the note in a code block or comment, or show lines hidden there, so nothing was written. Change it in the note.";

export function commentMarkIn(label: string): string {
  return `The ${label.toLowerCase()} can't hold %%, which starts a comment that would hide the rest of the note.`;
}

export function endsInBlockId(label: string): string {
  return `The ${label.toLowerCase()} can't end in a block id like ^stats.`;
}

export function refusalForValue(name: string, label: string, value: string): string | null {
  if (value === "") return null;
  if (value.includes("%%")) return commentMarkIn(label);
  if (BLOCK_ID.test(factLine(name, value))) return endsInBlockId(label);
  if (factsOf(factLine(name, value))[0]!.value !== value) return readsBackDifferently(label);
  return null;
}

export function refusalForValues(entry: CharacterEntry): string | null {
  for (const { fact, label } of ENTRY_FIELDS) {
    const refusal = refusalForValue(fact, label, entry[fact]);
    if (refusal !== null) return refusal;
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

interface StatingLine {
  line: number;
  alone: boolean;
  hidden: boolean;
}

function linesStating(text: string, path: string, name: string): StatingLine[] {
  const lines = text.split("\n");
  const hidden = hiddenLines(text);
  return overrideFacts(text, path)
    .filter((candidate) => sameName(candidate.name, name))
    .map(({ source }) => ({
      line: source.line,
      alone: factsOf(withoutBullet(lines[source.line]!)).length === 1,
      hidden: hidden.has(source.line),
    }));
}

type Origins = (number | null)[];

interface Draft {
  text: string;
  origins: Origins;
}

function changeable(text: string, line: number, label: string): number {
  if (BLOCK_ID.test(text.split("\n")[line]!)) throw new Error(blockIdOn(label));
  return line;
}

function withDropped(draft: Draft, lines: number[]): Draft {
  return {
    text: removeLines(draft.text, lines.map((line) => ({ line, matches: () => true }))).text,
    origins: draft.origins.filter((_origin, index) => !lines.includes(index)),
  };
}

function withRewritten(draft: Draft, line: number, written: string): Draft {
  const origins = [...draft.origins];
  origins[line] = null;
  return { text: rewriteLine(draft.text, { line, matches: () => true }, written)!, origins };
}

function withAppended(draft: Draft, written: string): Draft {
  const text = appendLines(draft.text, [written]);
  let kept = draft.origins.length;
  if (draft.text === "" || draft.text.endsWith("\n")) kept -= 1;
  const origins = draft.origins.slice(0, kept);
  while (origins.length < text.split("\n").length) origins.push(null);
  return { text, origins };
}

function withValue(draft: Draft, path: string, name: string, label: string, value: string): Draft {
  const stating = linesStating(draft.text, path, name);
  if (value === "") {
    const alone = stating.filter((candidate) => candidate.alone && !candidate.hidden);
    return withDropped(draft, alone.map(({ line }) => changeable(draft.text, line, label)));
  }
  const last = stating[stating.length - 1];
  if (last === undefined || !last.alone || last.hidden) return withAppended(draft, factLine(name, value));
  return withRewritten(draft, changeable(draft.text, last.line, label), factLine(name, value));
}

function refuseUnlessWritten(changed: string, path: string, changes: OverrideChange[]): void {
  for (const { name, label, after } of changes) {
    const written = overrideValueOf(changed, path, name);
    if (written !== after) throw new Error(stillReads(label, written));
  }
}

function refuseIfHidingChanges(text: string, draft: Draft): void {
  const hiddenBefore = hiddenLines(text);
  const hiddenAfter = hiddenLines(draft.text);
  for (const [index, origin] of draft.origins.entries()) {
    let wasHidden = false;
    if (origin !== null) wasHidden = hiddenBefore.has(origin);
    if (hiddenAfter.has(index) !== wasHidden) throw new Error(HIDING_WOULD_CHANGE);
  }
}

export function withOverrides(text: string, path: string, changes: OverrideChange[]): string {
  const changed = changes.filter(({ before, after }) => after !== before);
  let draft: Draft = { text, origins: text.split("\n").map((_line, index) => index) };
  for (const { name, label, before, after } of changed) {
    if (overrideValueOf(text, path, name) !== before) throw new Error(CHANGED_IN_NOTE);
    draft = withValue(draft, path, name, label, after);
  }
  refuseUnlessWritten(draft.text, path, changed);
  refuseIfHidingChanges(text, draft);
  if (!keepsProperties(text, draft.text)) throw new Error(PROPERTIES_WOULD_CHANGE);
  return draft.text;
}

export function withEntryValues(text: string, path: string, before: CharacterEntry, after: CharacterEntry): string {
  const changes = ENTRY_FIELDS.map(({ fact, label }) => ({ name: fact, label, before: before[fact], after: after[fact] }));
  return withOverrides(text, path, changes);
}
