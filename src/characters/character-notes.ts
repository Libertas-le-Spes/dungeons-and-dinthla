import type { App, TFile } from "obsidian";
import { topFolderOf } from "../campaign/campaign-folders";
import { findLinks } from "../notes/link";

export interface CharacterNotes {
  textOf(file: TFile): Promise<string>;
  pathOfLink(linktext: string, sourcePath: string): string | null;
  isOwnCharacter(file: TFile): boolean;
}

function ownCharacterLinks(campaignNote: Record<string, unknown> | undefined): string[] {
  if (campaignNote === undefined) return [];
  const character = campaignNote.character;
  if (typeof character !== "string") return [];
  return findLinks(character);
}

function pathOfLink(app: App, linktext: string, sourcePath: string): string | null {
  const note = app.metadataCache.getFirstLinkpathDest(linktext, sourcePath);
  if (note === null) return null;
  return note.path;
}

function isOwnCharacter(app: App, file: TFile): boolean {
  const folder = topFolderOf(file.path);
  const campaignNotePath = `${folder}/${folder}.md`;
  const links = ownCharacterLinks(app.metadataCache.getCache(campaignNotePath)?.frontmatter);
  return links.some((link) => pathOfLink(app, link, campaignNotePath) === file.path);
}

export function characterNotesOf(app: App): CharacterNotes {
  return {
    textOf: (file) => app.vault.cachedRead(file),
    pathOfLink: (linktext, sourcePath) => pathOfLink(app, linktext, sourcePath),
    isOwnCharacter: (file) => isOwnCharacter(app, file),
  };
}
