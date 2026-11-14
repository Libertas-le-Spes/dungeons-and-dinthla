import { characterReferenceKind } from "../../kinds/character-reference-kind";
import { itemTrackedKind } from "../../kinds/item-tracked-kind";
import type { ReferenceKind } from "../../kinds/reference-kind";
import { sessionNumberOf } from "./session-file";

export const NO_CAMPAIGN =
  "Make a campaign first: a folder inside your Campaigns folder with a main note of the same name. Set the Campaigns folder in the plugin's settings.";

export function campaignNameOf(folder: string): string {
  return folder.slice(folder.lastIndexOf("/") + 1);
}

function campaignFolderAround(path: string, campaignsFolder: string | null): string | null {
  if (campaignsFolder === null) return null;
  const inside = `${campaignsFolder}/`;
  if (!path.startsWith(inside)) return null;
  const rest = path.slice(inside.length);
  const slash = rest.indexOf("/");
  if (slash < 1) return null;
  return `${inside}${rest.slice(0, slash)}`;
}

export function mainNotePathOf(folder: string): string {
  return `${folder}/${campaignNameOf(folder)}.md`;
}

export function referenceFolderOf(kind: ReferenceKind, campaignFolder: string): string {
  return `${campaignFolder}/${kind.folder}`;
}

export function charactersFolderOf(campaignFolder: string): string {
  return referenceFolderOf(characterReferenceKind, campaignFolder);
}

export function isInReferenceFolder(kind: ReferenceKind, campaignFolder: string, path: string): boolean {
  return path.startsWith(`${referenceFolderOf(kind, campaignFolder)}/`);
}

export function itemsFolderOf(campaignFolder: string): string {
  return `${campaignFolder}/${itemTrackedKind.folder}`;
}

export function isInItemsFolder(campaignFolder: string, path: string): boolean {
  return path.startsWith(`${itemsFolderOf(campaignFolder)}/`);
}

export const FALLEN_FOLDER = "Fallen";

export function fallenFolderOf(campaignFolder: string): string {
  return `${campaignFolder}/${FALLEN_FOLDER}`;
}

export function fallenNotePathOf(campaignFolder: string, name: string): string {
  return `${fallenFolderOf(campaignFolder)}/${name}.md`;
}

export function isInFallenFolder(campaignFolder: string, path: string): boolean {
  return path.startsWith(`${fallenFolderOf(campaignFolder)}/`);
}

export function charactersBasePathOf(campaignFolder: string): string {
  return `${campaignFolder}/Characters.base`;
}

function isMarkdownNote(path: string): boolean {
  return path.endsWith(".md");
}

export function campaignOfReference(kind: ReferenceKind, path: string, campaignFolders: string[]): string | null {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return null;
  if (!isInReferenceFolder(kind, folder, path) || !isMarkdownNote(path)) return null;
  return folder;
}

export function campaignOfItem(path: string, campaignFolders: string[]): string | null {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return null;
  if (!isInItemsFolder(folder, path) || !isMarkdownNote(path)) return null;
  return folder;
}

export function campaignOfFallen(path: string, campaignFolders: string[]): string | null {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return null;
  if (!isInFallenFolder(folder, path) || !isMarkdownNote(path)) return null;
  return folder;
}

export function campaignNotePathOf(path: string, campaignFolders: string[]): string | null {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return null;
  return mainNotePathOf(folder);
}

function campaignFolderNaming(path: string, campaignsFolder: string | null): string | null {
  const folder = campaignFolderAround(path, campaignsFolder);
  if (folder === null || path !== mainNotePathOf(folder)) return null;
  return folder;
}

export function isMainNote(path: string, campaignsFolder: string | null): boolean {
  return campaignFolderNaming(path, campaignsFolder) !== null;
}

export function findCampaignFolders(paths: string[], campaignsFolder: string | null): string[] {
  const folders = new Set<string>();
  for (const path of paths) {
    const folder = campaignFolderNaming(path, campaignsFolder);
    if (folder !== null) folders.add(folder);
  }
  return [...folders].sort();
}

export function campaignFolderOf(path: string, campaignFolders: string[]): string | null {
  const folder = campaignFolders.find((candidate) => path.startsWith(`${candidate}/`));
  if (folder === undefined) return null;
  return folder;
}

export function chosenCampaignFolder(wanted: string | null, campaignFolders: string[]): string | null {
  if (wanted !== null && campaignFolders.includes(wanted)) return wanted;
  const [first] = campaignFolders;
  if (first === undefined) return null;
  return first;
}

export function startingCampaignFolder(activePath: string | null, chosen: string | null, campaignFolders: string[]): string | null {
  if (activePath !== null) {
    const active = campaignFolderOf(activePath, campaignFolders);
    if (active !== null) return active;
  }
  return chosenCampaignFolder(chosen, campaignFolders);
}

export function isSessionNote(path: string, campaignsFolder: string | null, noteExists: (path: string) => boolean): boolean {
  const folder = campaignFolderAround(path, campaignsFolder);
  if (folder === null || sessionNumberOf(path, folder) === null) return false;
  return noteExists(mainNotePathOf(folder));
}
