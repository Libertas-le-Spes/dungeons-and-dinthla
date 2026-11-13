import { firstLineAfterProperties } from "../../campaign/paths/session-file";
import { IMPORTED_FROM_PROPERTY, SHEET_VALUE_PROPERTIES } from "../../imports/layout/import-properties";
import { ROUTE_WORDS, UNNAMED_ROUTE_WORDS } from "../../imports/layout/import-routes";
import type { ImportedFact } from "./imported-fact";
import { noteLinesOf } from "./note-lines";
import { NumberWorkings } from "./number-workings";
import { propertyEntriesOf, type PropertyEntry } from "./property-entries";
import { shownPropertyValue } from "./shown-text";

function routeWordsOf(entries: readonly PropertyEntry[]): string | null {
  for (const entry of entries) {
    if (entry.key !== IMPORTED_FROM_PROPERTY) continue;
    const words = ROUTE_WORDS.get(entry.value.trim());
    if (words === undefined) return UNNAMED_ROUTE_WORDS;
    return words;
  }
  return null;
}

export function importedFactsOf(text: string, path: string): ImportedFact[] {
  const lines = noteLinesOf(text);
  const bodyStart = firstLineAfterProperties(text);
  const entries = propertyEntriesOf(lines, bodyStart);
  const route = routeWordsOf(entries);
  if (route === null) return [];
  const workings = NumberWorkings.of(lines, bodyStart);
  const facts: ImportedFact[] = [];
  for (const entry of entries) {
    if (!SHEET_VALUE_PROPERTIES.includes(entry.key)) continue;
    const value = shownPropertyValue(entry.value);
    if (value === "") continue;
    facts.push({ name: entry.key, value, source: { path, line: entry.line }, route, working: workings.workingFor(entry.key) });
  }
  return facts;
}
