import { firstLineAfterProperties } from "../../../campaign/paths/session-file";
import { IMPORTED_FROM_PROPERTY } from "../../../imports/layout/import-properties";
import { PDF_ROUTE_NAME } from "../../../imports/layout/pdf-gaps";
import type { PluginSection } from "../../../imports/layout/plugin-section";
import { PLUGIN_SECTIONS } from "../../../imports/layout/plugin-sections";
import { noteLinesOf } from "../reading/note-lines";
import { propertyEntriesOf, type PropertyEntry } from "../reading/property-entries";
import { NOTHING_LISTED, sectionEntriesOf, type SectionEntries } from "./section-entries";

function routeNameOf(entries: readonly PropertyEntry[]): string | null {
  for (const entry of entries) {
    if (entry.key === IMPORTED_FROM_PROPERTY) return entry.value.trim();
  }
  return null;
}

export class ImportedLists {
  private constructor(
    private readonly routeName: string,
    private readonly sections: ReadonlyMap<PluginSection, SectionEntries>,
  ) {}

  static of(text: string): ImportedLists | null {
    const lines = noteLinesOf(text);
    const bodyStart = firstLineAfterProperties(text);
    const routeName = routeNameOf(propertyEntriesOf(lines, bodyStart));
    if (routeName === null) return null;
    const sections = new Map<PluginSection, SectionEntries>();
    for (const section of PLUGIN_SECTIONS) sections.set(section, sectionEntriesOf(lines, bodyStart, section));
    return new ImportedLists(routeName, sections);
  }

  get isFromPdf(): boolean {
    return this.routeName === PDF_ROUTE_NAME;
  }

  of(section: PluginSection): SectionEntries {
    const entries = this.sections.get(section);
    if (entries === undefined) return NOTHING_LISTED;
    return entries;
  }
}
