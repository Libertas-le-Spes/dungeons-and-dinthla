import { campaignFolderOf, campaignOfCharacter, charactersBasePathOf, mainNotePathOf } from "../campaign/campaign-folders";
import { sessionNumberOf } from "../campaign/session-file";
import type { PageId } from "./campaign-pages";

interface OpenedFile {
  path: string;
  campaignFolder: string;
  campaignFolders: string[];
}

interface FileRule {
  page: PageId;
  matches(file: OpenedFile): boolean;
}

function isMainNote(file: OpenedFile): boolean {
  return file.path === mainNotePathOf(file.campaignFolder);
}

function isCharactersBase(file: OpenedFile): boolean {
  return file.path === charactersBasePathOf(file.campaignFolder);
}

function isCharacterNote(file: OpenedFile): boolean {
  return campaignOfCharacter(file.path, file.campaignFolders) !== null;
}

function isSessionNote(file: OpenedFile): boolean {
  return sessionNumberOf(file.path, file.campaignFolder) !== null;
}

const FILE_RULES: FileRule[] = [
  { page: "home", matches: isMainNote },
  { page: "cast", matches: isCharactersBase },
  { page: "cast", matches: isCharacterNote },
  { page: "notes", matches: isSessionNote },
];

export function pageOfFile(path: string, campaignFolders: string[]): PageId | null {
  const campaignFolder = campaignFolderOf(path, campaignFolders);
  if (campaignFolder === null) return null;
  const file = { path, campaignFolder, campaignFolders };
  const rule = FILE_RULES.find((candidate) => candidate.matches(file));
  if (rule === undefined) return null;
  return rule.page;
}
