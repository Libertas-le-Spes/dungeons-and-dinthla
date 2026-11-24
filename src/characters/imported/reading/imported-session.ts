import { firstLineAfterProperties, type PropertiesSyntax } from "../../../campaign/paths/session-file";
import { IMPORTED_SESSION_PROPERTY } from "../../../imports/layout/import-properties";
import { noteLinesOf } from "./note-lines";
import { propertyEntriesOf } from "./property-entries";

const WHOLE_NUMBER = /^\d+$/;

export function importedSessionOf(noteText: string, syntax: PropertiesSyntax): number | null {
  const entries = propertyEntriesOf(noteLinesOf(noteText), firstLineAfterProperties(noteText, syntax));
  for (const entry of entries) {
    if (entry.key !== IMPORTED_SESSION_PROPERTY) continue;
    const value = entry.value.trim();
    if (WHOLE_NUMBER.test(value)) return Number(value);
    return null;
  }
  return null;
}
