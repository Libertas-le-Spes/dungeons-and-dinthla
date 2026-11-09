import { campaignFolderOf, charactersBasePathOf, isCharacterNotePath, mainNotePathOf } from "../campaign/campaign-folders";
import type { PageId } from "./campaign-pages";

interface FileRule {
  page: PageId;
  matches(path: string, campaignFolder: string, campaignFolders: string[]): boolean;
}

const FILE_RULES: FileRule[] = [
  { page: "home", matches: (path, campaignFolder) => path === mainNotePathOf(campaignFolder) },
  { page: "cast", matches: (path, campaignFolder) => path === charactersBasePathOf(campaignFolder) },
  { page: "cast", matches: (path, _campaignFolder, campaignFolders) => isCharacterNotePath(path, campaignFolders) },
];

export function pageOfFile(path: string, campaignFolders: string[]): PageId | null {
  const campaignFolder = campaignFolderOf(path, campaignFolders);
  if (campaignFolder === null) return null;
  const rule = FILE_RULES.find((candidate) => candidate.matches(path, campaignFolder, campaignFolders));
  if (rule === undefined) return null;
  return rule.page;
}
