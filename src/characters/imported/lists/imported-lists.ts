import { firstLineAfterProperties } from "../../../campaign/paths/session-file";
import { IMPORTED_FROM_PROPERTY } from "../../../imports/layout/import-properties";
import type { PluginSection } from "../../../imports/layout/plugin-section";
import { PLUGIN_SECTIONS } from "../../../imports/layout/plugin-sections";
import { noteLinesOf } from "../reading/note-lines";
import { propertyEntriesOf, type PropertyEntry } from "../reading/property-entries";
import { NOTHING_LISTED, sectionEntriesOf, type SectionEntries } from "./section-entries";

function isImported(entries: readonly PropertyEntry[]): boolean {
  return entries.some((entry) => entry.key === IMPORTED_FROM_PROPERTY);
}

export class ImportedLists {
  private constructor(private readonly sections: ReadonlyMap<PluginSection, SectionEntries>) {}

  static of(text: string): ImportedLists | null {
    const lines = noteLinesOf(text);
    const bodyStart = firstLineAfterProperties(text);
    if (!isImported(propertyEntriesOf(lines, bodyStart))) return null;
    const sections = new Map<PluginSection, SectionEntries>();
    for (const section of PLUGIN_SECTIONS) sections.set(section, sectionEntriesOf(lines, bodyStart, section));
    return new ImportedLists(sections);
  }

  of(section: PluginSection): SectionEntries {
    const entries = this.sections.get(section);
    if (entries === undefined) return NOTHING_LISTED;
    return entries;
  }
}
