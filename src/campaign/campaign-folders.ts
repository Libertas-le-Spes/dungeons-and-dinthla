import { sessionNumberOf } from "./session-file";

export const NO_CAMPAIGN = "Make a campaign first: a top-level folder with a main note of the same name.";

function topFolderOf(path: string): string | null {
  const slash = path.indexOf("/");
  if (slash === -1) return null;
  return path.slice(0, slash);
}

function mainNoteOf(folder: string): string {
  return `${folder}/${folder}.md`;
}

export function campaignNotePathOf(path: string): string | null {
  const folder = topFolderOf(path);
  if (folder === null) return null;
  return mainNoteOf(folder);
}

export function findCampaignFolders(paths: string[]): string[] {
  const folders = new Set<string>();
  for (const path of paths) {
    const folder = topFolderOf(path);
    if (folder !== null && path === mainNoteOf(folder)) folders.add(folder);
  }
  return [...folders].sort();
}

export function campaignFolderOf(path: string, campaignFolders: string[]): string | null {
  const folder = topFolderOf(path);
  if (folder === null || !campaignFolders.includes(folder)) return null;
  return folder;
}

export function isSessionNote(path: string, noteExists: (path: string) => boolean): boolean {
  const folder = topFolderOf(path);
  if (folder === null || sessionNumberOf(path, folder) === null) return false;
  return noteExists(mainNoteOf(folder));
}
