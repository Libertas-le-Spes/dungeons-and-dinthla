import type { TFile } from "obsidian";
import type { SessionNote } from "../../campaign/record/campaign";
import { campaignNotePathOf, isInReferenceFolder } from "../../campaign/paths/campaign-folders";
import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { readSessions } from "../../campaign/reading/read-campaign";
import type { Gate } from "../../fence/gate/gatekeeper";

export interface CharacterNotes {
  holds(file: TFile): boolean;
  textOf(file: TFile): Promise<string>;
  pathOfLink(linktext: string, sourcePath: string): string | null;
  isOwnCharacter(file: TFile): boolean;
  campaignFolders(): string[];
  filesIn(campaignFolder: string): TFile[];
  sessionsOf(campaignFolder: string): Promise<SessionNote[]>;
  onNoteChanged(changed: (path: string) => void): () => void;
}

function pathOfLink(gate: Gate, linktext: string, sourcePath: string): string | null {
  const note = gate.metadata.getFirstLinkpathDest(linktext, sourcePath);
  if (note === null) return null;
  return note.path;
}

function ownCharacterLinks(gate: Gate, campaignNotePath: string): string[] {
  const links = gate.metadata.getCache(campaignNotePath)?.frontmatterLinks;
  if (links === undefined) return [];
  return links.filter((link) => link.key === "character").map((link) => link.link);
}

export type CampaignFolders = () => string[];

function isOwnCharacter(gate: Gate, campaignFolders: CampaignFolders, file: TFile): boolean {
  const campaignNotePath = campaignNotePathOf(file.path, campaignFolders());
  if (campaignNotePath === null) return false;
  const links = ownCharacterLinks(gate, campaignNotePath);
  return links.some((link) => pathOfLink(gate, link, campaignNotePath) === file.path);
}

function filesIn(gate: Gate, campaignFolder: string): TFile[] {
  const files = gate.files.getMarkdownFiles().filter((file) => isInReferenceFolder(characterReferenceKind, campaignFolder, file.path));
  return files.sort((first, second) => first.basename.localeCompare(second.basename));
}

function onNoteChanged(gate: Gate, changed: (path: string) => void): () => void {
  const event = gate.metadata.on("changed", (file) => changed(file.path));
  return () => gate.metadata.offref(event);
}

export function characterNotesOf(gate: Gate, campaignFolders: CampaignFolders): CharacterNotes {
  return {
    holds: (file) => gate.files.getFileByPath(file.path) === file,
    textOf: (file) => gate.files.cachedRead(file),
    pathOfLink: (linktext, sourcePath) => pathOfLink(gate, linktext, sourcePath),
    isOwnCharacter: (file) => isOwnCharacter(gate, campaignFolders, file),
    campaignFolders,
    filesIn: (campaignFolder) => filesIn(gate, campaignFolder),
    sessionsOf: (campaignFolder) => readSessions(gate.files, campaignFolder),
    onNoteChanged: (changed) => onNoteChanged(gate, changed),
  };
}
