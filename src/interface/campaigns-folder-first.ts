import type { CampaignsFolderPath } from "../fence/fence";
import type { MakePage, NavSection, PageEntry } from "./campaign-pages";

function askingFirst(make: MakePage, ask: MakePage, campaignsFolder: CampaignsFolderPath): MakePage {
  return (contentEl, show, path, stayOn) => {
    if (campaignsFolder() === null) return ask(contentEl, show, null, stayOn);
    return make(contentEl, show, path, stayOn);
  };
}

export function campaignsFolderFirst(sections: NavSection[], ask: MakePage, campaignsFolder: CampaignsFolderPath): NavSection[] {
  const askingEntry = (entry: PageEntry): PageEntry => ({ ...entry, make: askingFirst(entry.make, ask, campaignsFolder) });
  return sections.map((section) => ({ ...section, pages: section.pages.map(askingEntry) }));
}
