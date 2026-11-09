import { sessionNumberOf } from "./session-file";

export const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";

function topFolderOf(path: string): string | null {
  const slash = path.indexOf("/");
  if (slash === -1) return null;
  return path.slice(0, slash);
}

export function mainNotePathOf(folder: string): string {
  return `${folder}/${folder}.md`;
}

export function charactersFolderOf(campaignFolder: string): string {
  return `${campaignFolder}/Characters`;
}

export function charactersBasePathOf(campaignFolder: string): string {
  return `${campaignFolder}/Characters.base`;
}

export function isCharacterNotePath(path: string, campaignFolders: string[]): boolean {
  const folder = campaignFolderOf(path, campaignFolders);
  if (folder === null) return false;
  return path.startsWith(`${charactersFolderOf(folder)}/`) && path.endsWith(".md");
}

export function campaignNotePathOf(path: string): string | null {
  const folder = topFolderOf(path);
  if (folder === null) return null;
  return mainNotePathOf(folder);
}

function campaignFolderNaming(path: string): string | null {
  const folder = topFolderOf(path);
  if (folder === null || path !== mainNotePathOf(folder)) return null;
  return folder;
}

export function isMainNote(path: string): boolean {
  return campaignFolderNaming(path) !== null;
}

export function findCampaignFolders(paths: string[]): string[] {
  const folders = new Set<string>();
  for (const path of paths) {
    const folder = campaignFolderNaming(path);
    if (folder !== null) folders.add(folder);
  }
  return [...folders].sort();
}

export function campaignFolderOf(path: string, campaignFolders: string[]): string | null {
  const folder = topFolderOf(path);
  if (folder === null || !campaignFolders.includes(folder)) return null;
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

export function isSessionNote(path: string, noteExists: (path: string) => boolean): boolean {
  const folder = topFolderOf(path);
  if (folder === null || sessionNumberOf(path, folder) === null) return false;
  return noteExists(mainNotePathOf(folder));
}
