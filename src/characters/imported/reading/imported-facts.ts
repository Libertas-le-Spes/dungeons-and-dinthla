import { firstLineAfterProperties } from "../../../campaign/paths/session-file";
import { IMPORTED_FROM_PROPERTY, SHEET_VALUE_PROPERTIES } from "../../../imports/layout/import-properties";
import type { ImportedFact } from "./imported-fact";
import { noteLinesOf } from "./note-lines";
import { propertyEntriesOf, type PropertyEntry } from "./property-entries";
import { shownPropertyValue } from "./shown-text";

function isImported(entries: readonly PropertyEntry[]): boolean {
  return entries.some((entry) => entry.key === IMPORTED_FROM_PROPERTY);
}

export function importedFactsOf(text: string, path: string): ImportedFact[] {
  const lines = noteLinesOf(text);
  const bodyStart = firstLineAfterProperties(text);
  const entries = propertyEntriesOf(lines, bodyStart);
  if (!isImported(entries)) return [];
  const facts: ImportedFact[] = [];
  for (const entry of entries) {
    if (!SHEET_VALUE_PROPERTIES.includes(entry.key)) continue;
    const value = shownPropertyValue(entry.value);
    if (value === "") continue;
    facts.push({ name: entry.key, value, source: { path, line: entry.line } });
  }
  return facts;
}
