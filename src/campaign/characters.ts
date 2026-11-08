import type { App } from "obsidian";
import { charactersFolderOf } from "./campaign-folders";

export interface Character {
  name: string;
  linktext: string;
}

export function charactersIn(app: App, campaignFolder: string, sessionPath: string): Character[] {
  const charactersFolder = `${charactersFolderOf(campaignFolder)}/`;
  const characters: Character[] = [];
  for (const file of app.vault.getMarkdownFiles()) {
    if (!file.path.startsWith(charactersFolder)) continue;
    if (characters.some((character) => character.name === file.basename)) continue;
    characters.push({ name: file.basename, linktext: app.metadataCache.fileToLinktext(file, sessionPath, true) });
  }
  return characters.sort((first, second) => first.name.localeCompare(second.name));
}
