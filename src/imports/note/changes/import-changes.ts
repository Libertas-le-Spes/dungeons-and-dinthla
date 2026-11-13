import { IMPORTED_ON_PROPERTY, IMPORT_PROPERTIES } from "../../layout/import-properties";
import { PLUGIN_SECTIONS } from "../../layout/plugin-sections";
import { LINE_START } from "../../layout/section-line-format";
import { NoteLayout } from "../reading/note-layout";
import { linesWithout } from "./line-difference";
import { propertyValuesOf } from "./property-values";
import { writtenLinesOf } from "./written-lines";

export interface PropertyChange {
  readonly name: string;
  readonly before: string | null;
  readonly after: string | null;
}

export interface SectionChange {
  readonly heading: string;
  readonly removed: readonly string[];
  readonly added: readonly string[];
}

export interface TypedText {
  readonly heading: string;
  readonly lines: readonly string[];
}

export interface ImportChanges {
  readonly properties: readonly PropertyChange[];
  readonly sections: readonly SectionChange[];
  readonly typed: readonly TypedText[];
}

function valueOrNull(values: ReadonlyMap<string, string>, name: string): string | null {
  const value = values.get(name);
  if (value === undefined) return null;
  return value;
}

function propertyChangesOf(before: NoteLayout, after: NoteLayout): PropertyChange[] {
  const was = propertyValuesOf(before);
  const now = propertyValuesOf(after);
  const changes: PropertyChange[] = [];
  for (const name of IMPORT_PROPERTIES) {
    if (name === IMPORTED_ON_PROPERTY) continue;
    const change = { name, before: valueOrNull(was, name), after: valueOrNull(now, name) };
    if (change.before !== change.after) changes.push(change);
  }
  return changes;
}

function sectionChangesOf(before: NoteLayout, after: NoteLayout): SectionChange[] {
  const changes: SectionChange[] = [];
  for (const section of PLUGIN_SECTIONS) {
    const was = writtenLinesOf(before.sectionLines(section));
    const now = writtenLinesOf(after.sectionLines(section));
    const removed = linesWithout(was, now);
    const added = linesWithout(now, was);
    if (removed.length + added.length > 0) changes.push({ heading: section.heading, removed, added });
  }
  return changes;
}

function isTyped(line: string): boolean {
  return !line.startsWith(LINE_START);
}

function typedTextIn(before: NoteLayout): TypedText[] {
  const found: TypedText[] = [];
  for (const section of PLUGIN_SECTIONS) {
    const lines = writtenLinesOf(before.sectionLines(section)).filter(isTyped);
    if (lines.length > 0) found.push({ heading: section.heading, lines });
  }
  return found;
}

export function importChangesOf(before: string, after: string): ImportChanges {
  const was = NoteLayout.of(before);
  const now = NoteLayout.of(after);
  return { properties: propertyChangesOf(was, now), sections: sectionChangesOf(was, now), typed: typedTextIn(was) };
}

export function changesNothing(changes: ImportChanges): boolean {
  return changes.properties.length + changes.sections.length === 0;
}
