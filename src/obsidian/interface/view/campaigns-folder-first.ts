import type { ReadCampaignsFolder } from "../../../fence/paths/fence";
import type { MakePage, NavSection, PageEntry } from "./campaign-pages";

function askingFirst(make: MakePage, ask: MakePage, readCampaignsFolder: ReadCampaignsFolder): MakePage {
  return (contentEl, show, path, stayOn) => {
    if (readCampaignsFolder() === null) return ask(contentEl, show, null, stayOn);
    return make(contentEl, show, path, stayOn);
  };
}

export function campaignsFolderFirst(sections: NavSection[], ask: MakePage, readCampaignsFolder: ReadCampaignsFolder): NavSection[] {
  const askingEntry = (entry: PageEntry): PageEntry => ({ ...entry, make: askingFirst(entry.make, ask, readCampaignsFolder) });
  return sections.map((section) => ({ ...section, pages: section.pages.map(askingEntry) }));
}
