import { campaignFolderOf, fallenFolderOf } from "./campaign-folders";

const NOTE_EXTENSION = ".md";
const SLASH = "/";

export function isCharacterNotePath(path: string, charactersFolder: string): boolean {
  const inside = `${charactersFolder}${SLASH}`;
  if (!path.startsWith(inside)) return false;
  const rest = path.slice(inside.length);
  return !rest.includes(SLASH) && rest.endsWith(NOTE_EXTENSION);
}

export function isFallenNotePath(path: string, campaignFolders: string[]): boolean {
  const campaignFolder = campaignFolderOf(path, campaignFolders);
  if (campaignFolder === null) return false;
  return isCharacterNotePath(path, fallenFolderOf(campaignFolder));
}
