import type { App, TFile } from "obsidian";
import type { SessionNote } from "../campaign/campaign";
import { campaignNotePathOf, findCampaignFolders } from "../campaign/campaign-folders";
import { readSessions } from "../campaign/read-campaign";

export interface CharacterNotes {
  textOf(file: TFile): Promise<string>;
  pathOfLink(linktext: string, sourcePath: string): string | null;
  isOwnCharacter(file: TFile): boolean;
  campaignFolders(): string[];
  filesIn(campaignFolder: string): TFile[];
  sessionsOf(campaignFolder: string): Promise<SessionNote[]>;
  onNoteChanged(changed: (path: string) => void): () => void;
}

function pathOfLink(app: App, linktext: string, sourcePath: string): string | null {
  const note = app.metadataCache.getFirstLinkpathDest(linktext, sourcePath);
  if (note === null) return null;
  return note.path;
}

function ownCharacterLinks(app: App, campaignNotePath: string): string[] {
  const links = app.metadataCache.getCache(campaignNotePath)?.frontmatterLinks;
  if (links === undefined) return [];
  return links.filter((link) => link.key === "character").map((link) => link.link);
}

function isOwnCharacter(app: App, file: TFile): boolean {
  const campaignNotePath = campaignNotePathOf(file.path);
  if (campaignNotePath === null) return false;
  const links = ownCharacterLinks(app, campaignNotePath);
  return links.some((link) => pathOfLink(app, link, campaignNotePath) === file.path);
}

function filesIn(app: App, campaignFolder: string): TFile[] {
  const charactersFolder = `${campaignFolder}/Characters/`;
  const files = app.vault.getMarkdownFiles().filter((file) => file.path.startsWith(charactersFolder));
  return files.sort((first, second) => first.basename.localeCompare(second.basename));
}

function onNoteChanged(app: App, changed: (path: string) => void): () => void {
  const event = app.metadataCache.on("changed", (file) => changed(file.path));
  return () => app.metadataCache.offref(event);
}

export function characterNotesOf(app: App): CharacterNotes {
  return {
    textOf: (file) => app.vault.cachedRead(file),
    pathOfLink: (linktext, sourcePath) => pathOfLink(app, linktext, sourcePath),
    isOwnCharacter: (file) => isOwnCharacter(app, file),
    campaignFolders: () => findCampaignFolders(app.vault.getFiles().map((file) => file.path)),
    filesIn: (campaignFolder) => filesIn(app, campaignFolder),
    sessionsOf: (campaignFolder) => readSessions(app.vault, campaignFolder),
    onNoteChanged: (changed) => onNoteChanged(app, changed),
  };
}
